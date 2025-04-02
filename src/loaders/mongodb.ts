'use strict';

// INTERFACES
import {
  MongoClient,
  Collection,
  Db,
  CollectionInfo,
  Document,
  ObjectId,
} from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// MODELS
import models from '../models';

// createCollection function is responsible for creating a collection
// with the configuration of given arguments like collection schema and name.
async function create_collection(
  schema: any,
  client: MongoClient,
  options: any
): Promise<Collection | null> {
  const db: Db = client.db(config.ENV_DB_NAME);

  // Listing all the collections in the database and convert them to array
  // to check if there is any conflict on collection names.
  const collections: CollectionInfo[] = await db.listCollections({}).toArray();

  // If the parameter collectionName (name) is included in the database then that means
  // desired collection is already exists in the database
  // return null to check later in the createCollections before putting into Promise.all();
  const existing_collection: CollectionInfo | undefined = collections.find(
    (collection: any) => collection.name === schema.name
  );

  if (existing_collection) {
    options.db[schema.name] = db.collection(schema.name);
    return null;
  }

  /*
  if (schema.required.length) {
    $jsonSchema.required = schema.required;
  }
  */

  // where magic happens.
  // creation of schemas and configurations in database. returns a collection
  const result: Collection = await db.createCollection(schema.name, {
    validator: {
      $jsonSchema: {
        bsonType: schema.bsonType,
        properties: schema.properties,
      },
    },
  });

  // current collection
  const collection: Collection = db.collection(schema.name);

  // index registrations per property
  for (const key in schema.indexes) {
    const props: any = schema.indexes[key]; // index properties
    await collection.createIndex({ [key]: 1 }, props);
  }

  options.db[schema.name] = collection;

  return result;
}

export async function load_mongodb(options: options_i): Promise<MongoClient> {
  // Create a new MongoClient
  const client: MongoClient = new MongoClient(config.ENV_DB_URL);

  client.on('error', (err: any) => {});

  try {
    //throw { message: 'a ECONNREFUSED' };
    await client.connect();
  } catch (err: any) {
    const group: string = err.message.split(' ')[1];
    const port: number = Number(config.ENV_DB_URL.split(':')[2]);

    console.info(
      `[  \x1b[31mERROR\x1b[0m  ] MongoDB ${group} (PORT: \x1b[38;2;255;165;0m${port}\x1b[0m)\n`
    );

    console.info('            Debug: \x1b[1msystemctl status mongod\x1b[0m\n');

    process.exit(1);
  }

  options.db = client.db(config.ENV_DB_NAME);

  for (const schema of Object.values(models)) {
    await create_collection(schema, client, options);
  }

  // Update admins role keys string with the new environment ROLE_KEY_ADMIN
  const admins = await options.db.users.find({ role: 'admin' }).toArray();

  for (let i: number = 0; i < admins.length; i++) {
    options.db.users.updateOne(
      { _id: admins[i]._id },
      { $set: { role_key: config.ENV_ROLE_KEY_ADMIN } }
    );
  }

  return client;
}

export default load_mongodb;
