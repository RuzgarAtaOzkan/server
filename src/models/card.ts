'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'cards',
  indexes: [
    // [{ keys...}, { values...}]
    [{ user_id: 1 }, { unique: true }],
  ],
  properties: {
    user_id: {
      // user_id of the card owner
      bsonType: config.type_object_id,
    },

    label: {
      bsonType: config.type_string,
    },
    number: {
      bsonType: config.type_string, // card number
    },
    month: {
      bsonType: config.type_number, // card expiration month
    },
    year: {
      bsonType: config.type_number, // card expiration year
    },
    cvc: {
      bsonType: config.type_number, // card cvc
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
