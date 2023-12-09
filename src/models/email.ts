'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'emails',
  bsonType: config.types.object,
  required: ['email'],
  unique_props: ['email'],
  properties: {
    email: {
      bsonType: config.types.string,
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
