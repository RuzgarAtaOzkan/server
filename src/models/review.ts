'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'reviews',
  indexes: [
    // [{ keys...}, { values...}]
    [{ product_id: 1, user_id: 1 }, { unique: true }],
  ],
  properties: {
    product_id: {
      bsonType: config.type_object_id,
    },
    user_id: {
      bsonType: config.type_object_id,
    },

    rating: {
      bsonType: config.type_number,
    },
    comment: {
      bsonType: config.type_string,
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
