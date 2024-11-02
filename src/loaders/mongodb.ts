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
  const db: Db = client.db(config.env.DB_NAME);

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

  const $jsonSchema: any = {
    bsonType: schema.bsonType,
    properties: schema.properties,
  };

  /*
  if (schema.required.length) {
    $jsonSchema.required = schema.required;
  }
  */

  // where magic happens.
  // creation of schemas and configurations in database. returns a collection
  const result: Collection = await db.createCollection(schema.name, {
    validator: {
      $jsonSchema,
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

async function load_mongodb(options: any): Promise<MongoClient> {
  // Create a new MongoClient
  const client: MongoClient = new MongoClient(config.env.DB_URL);
  await client.connect();

  options.db = client.db(config.env.DB_NAME);

  for (const schema of Object.values(models)) {
    await create_collection(schema, client, options);
  }

  // Update admins role keys string with the new environment ROLE_KEY_ADMIN
  const admins = await options.db.users.find({ role: 'admin' }).toArray();

  for (let i: number = 0; i < admins.length; i++) {
    await options.db.users.updateOne(
      { _id: admins[i]._id },
      { $set: { role_key: config.env.ROLE_KEY_ADMIN } }
    );
  }

  return client;
}

export default load_mongodb;
