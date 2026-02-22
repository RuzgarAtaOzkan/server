'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'products',
  indexes: [],
  properties: {
    img: {
      bsonType: config.type_string,
    },
    name: {
      bsonType: config.type_string,
    },
    description: {
      bsonType: config.type_string,
    },
    category: {
      bsonType: config.type_string,
    },
    price: {
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
