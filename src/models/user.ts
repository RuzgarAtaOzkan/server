'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'users',
  indexes: [
    // [{ keys...}, { values...}]
    [{ username: 1 }, { unique: true }],
    [{ email: 1 }, { unique: true }],
    [{ email_verification_code: 1 }, { unique: true }],
    [{ password_reset_code: 1 }, { unique: true }],
    [{ ref_code: 1 }, { unique: true }],
  ],
  properties: {
    name: {
      bsonType: config.type_string,
    },

    username: {
      bsonType: config.type_string,
    },
    username_changed_at: {
      bsonType: config.type_date,
    },

    email: {
      bsonType: config.type_string,
    },
    email_verified: {
      bsonType: config.type_bool,
    },
    email_verification_code: {
      bsonType: config.type_string,
    },

    password: {
      bsonType: config.type_string,
    },
    password_reset_code: {
      bsonType: config.type_string,
    },

    img: {
      bsonType: config.type_string,
    },
    phone: {
      bsonType: config.type_string,
    },

    city: {
      bsonType: config.type_string, // istanbul
    },
    district: {
      bsonType: config.type_string, // buyukcekmece
    },
    address: {
      bsonType: config.type_string, // Sinanoba Mahallesi, Ibrahimzade caddesi, Sahiltepe Villalari, No: 2
    },
    zip: {
      bsonType: config.type_number, // 34535
    },

    role: {
      enum: [config.role_admin, config.role_user],
    },
    role_key: {
      bsonType: config.type_string,
    },

    ref_code: {
      bsonType: config.type_string,
    },
    ref_from: {
      bsonType: [config.type_object_id, config.type_null],
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
