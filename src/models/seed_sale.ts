'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'seed_sales',
  bsonType: config.types.object,
  required: ['hash'],
  unique_props: ['hash'],
  properties: {
    hash: {
      bsonType: config.types.string,
    },
    value: {
      bsonType: config.types.string,
    },
    from: {
      bsonType: config.types.string,
    },
    fulfilled: {
      bsonType: config.types.bool,
    },
    created_at: {
      bsonType: config.types.date,
    },
    updated_at: {
      bsonType: config.types.date,
    },
  },
};

export default schema;
