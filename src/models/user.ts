'use strict';

// CONFIG
import config from '../config';

const schema: any = {
  name: 'users',
  bsonType: config.type_object,
  indexes: {
    username: { unique: true },
    email: { unique: true },
    email_verification_code: { unique: true },
    password_reset_code: { unique: true },
    ref_code: { unique: true },
  },
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
      bsonType: config.type_string, // Istanbul
    },
    district: {
      bsonType: config.type_string, // Buyukcekmece
    },
    neighbourhood: {
      bsonType: config.type_string, // Sinanoba
    },
    address: {
      bsonType: config.type_string, // Ibrahimzade caddesi, Sahiltepe Villalari, No: 2
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

export default schema;
