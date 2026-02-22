'use strict';

// INTERFACES
import { MongoClient, Collection, Db, CollectionInfo, Document } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// MODELS
import models from '../models';

// UTILS
import { user_create_doc } from '../utils/services';

async function create_collection(
  model: any,
  client: MongoClient,
  options: any
): Promise<Collection | null> {
  const db: Db = client.db(config.ENV_DB_NAME);

  // list all the collections in the database and convert them to array
  // to check if there is any conflict on collection names.
  const collections: CollectionInfo[] = await db.listCollections({}).toArray();

  // If the parameter collectionName (name) is included in the database then that means
  // desired collection is already exists in the database
  // return null to check later in the createCollections before putting into Promise.all();
  const existing_collection: CollectionInfo | undefined = collections.find(
    (collection: any) => collection.name === model.name
  );

  if (existing_collection) {
    options.db[model.name] = db.collection(model.name);
    return null;
  }

  /*
  if (model.required.length) {
    $jsonSchema.required = model.required;
  }
  */

  // where magic happens
  // creation of schemas and configurations in database. returns a collection
  const result: Collection = await db.createCollection(model.name, {
    validator: {
      $jsonSchema: {
        bsonType: config.type_object,
        properties: model.properties,
      },
    },
  });

  // current collection
  const collection: Collection = db.collection(model.name);

  // index registrations
  for (let i: number = 0; i < model.indexes.length; i++) {
    const keys = model.indexes[i][0];
    const values = model.indexes[i][1];

    await collection.createIndex(keys, values);
  }

  options.db[model.name] = collection;

  return result;
}

export async function load_mongodb(options: options_i): Promise<MongoClient> {
  // Create a new MongoClient
  const client: MongoClient = new MongoClient(config.ENV_DB_URL);

  client.on('error', (err: any) => {});

  try {
    await client.connect();
  } catch (err: any) {
    const group: string = err.message.split(' ')[1];
    const port: number = Number(config.ENV_DB_URL.split(':')[2]);

    console.info(
      `[  \x1b[31mERR\x1b[0m  ] MongoDB ${group} (PORT: \x1b[38;2;255;165;0m${port}\x1b[0m)\n`
    );

    console.info('            Debug: \x1b[1msystemctl status mongod\x1b[0m\n');

    await options.redis.quit();

    process.exit(1);
  }

  // dependency injection
  options.db = client.db(config.ENV_DB_NAME);

  for (const model of Object.values(models)) {
    await create_collection(model, client, options);
  }

  // update admins role key strings with the new environment ROLE_KEY_ADMIN
  const admins: Document[] = await options.db.users
    .find({ role: config.role_admin })
    .toArray();

  for (let i: number = 0; i < admins.length; i++) {
    await options.db.users.updateOne(
      { _id: admins[i]._id, role: config.role_admin },
      { $set: { role_key: config.ENV_ROLE_KEY_ADMIN } }
    );
  }

  /*
  admin user insertion for production init
  const admin: Document = await user_create_doc(
    {
      name: 'Admin',
      username: 'admin',
      email: 'enescantepehan@gmail.com',
      password: '12345678',
    },
    options
  );
  admin.email_verified = true;
  admin.role = config.role_admin;
  admin.role_key = config.ENV_ROLE_KEY_ADMIN;
  await options.db.users.insertOne(admin);
  */

  return client;
}

export default load_mongodb;
