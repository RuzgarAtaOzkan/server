'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'provisions',
  indexes: [
    // [{ keys...}, { values...}]
    [{ created_at: 1 }, { expireAfterSeconds: 3600 }],
  ],
  properties: {
    // contact info
    name: {
      bsonType: config.type_string, // user name
    },
    email: {
      bsonType: config.type_string, // user email
    },
    phone: {
      bsonType: config.type_string, // user phone
    },

    // address
    city: {
      bsonType: config.type_string, // user city
    },
    district: {
      bsonType: config.type_string, // user district
    },
    address: {
      bsonType: config.type_string, // user adress
    },
    zip: {
      bsonType: config.type_number, // user zip
    },

    basket: {
      bsonType: config.type_string,
      // "[{ _id: "67c07abf2625563b826ce16b", quantity: 2 }]"
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
