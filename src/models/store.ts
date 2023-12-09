'use strict';

// CONFIG
import config from '../config';

const schema = {
  name: 'stores',
  bsonType: config.types.object,
  required: [],
  unique_props: [],
  properties: {
    name: {
      bsonType: config.types.string,
    },

    featured: {
      bsonType: config.types.bool,
    },

    img: {
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
