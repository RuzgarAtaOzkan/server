'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'locations',
  bsonType: config.types.object,
  indexes: {
    hash: {
      unique: true,
      partialFilterExpression: { hash: { $type: 'string' } },
    },
  },
  properties: {
    hash: {
      bsonType: [config.types.string, config.types.null],
    },
    location: {
      bsonType: config.types.string,
    },
    img: {
      bsonType: config.types.string,
    },
    desc: {
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
