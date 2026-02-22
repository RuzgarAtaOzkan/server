'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'coupons',
  indexes: [
    // [{ keys...}, { values...}]
    [{ code: 1 }, { unique: true }],
  ],
  properties: {
    code: {
      bsonType: config.type_string,
    },
    discount: {
      // 5 = 5%
      bsonType: config.type_number,
    },
    quantity: {
      bsonType: config.type_number,
    },

    created_at: {
      bsonType: config.type_date,
    },
    updated_at: {
      bsonType: config.type_date,
    },
  },
};

export default model;
