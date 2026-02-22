'use strict';

// CONFIG
import config from '../config';

// INTERFACES
import { model_i } from 'interfaces/models';

const model: model_i = {
  name: 'wallets', // generated crypto wallets to process orders
  indexes: [
    // [{ keys...}, { values...}]
    [{ private: 1 }, { unique: true }],
    [{ public: 1 }, { unique: true }],
  ],
  properties: {
    // wallet
    private: {
      bsonType: config.type_string,
      description: 'Private key of the generated crypto wallet',
    },
    public: {
      bsonType: config.type_string,
      description: 'Public key of the generated crypto wallet',
    },
    blockchain: {
      bsonType: config.type_string, // solana | ethereum | bitcoin
    },
    amount: {
      bsonType: config.type_number,
      description: 'Coin amount that needs to be sent to this wallet',
    },
    status: {
      bsonType: config.type_number, // [-2 refunded to users wallet, -1 = waiting for refund, 0 = waiting for txn, 1 = deposited, 2 = withrawed to our personal wallet]
    },

    // 3rd party RPC API values
    helius_subscription: {
      bsonType: config.type_number,
    },

    // order contact
    name: {
      bsonType: config.type_string, // user name
    },
    email: {
      bsonType: config.type_string, // user email
    },
    phone: {
      bsonType: config.type_string, // user phone
    },

    // order address
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

    // order basket
    basket: {
      bsonType: config.type_string,
      // "[{ _id: "67c07abf2625563b826ce16b", quantity: 2 }]"
    },
    // order data end

    created_at: {
      bsonType: config.type_date,
    },
    updated_at: {
      bsonType: config.type_date,
    },
  },
};

export default model;
