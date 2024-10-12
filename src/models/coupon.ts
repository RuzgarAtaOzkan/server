'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'coupons',
  bsonType: config.types.object,
  indexes: {
    code: { unique: true },
  },
  properties: {
    code: {
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
