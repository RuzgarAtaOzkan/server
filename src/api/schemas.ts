'use strict';

// CONFIG
import config from '../config';

export const user = {
  type: config.types.object,
  properties: {
    _id: { type: config.types.string },
    name: { type: config.types.string },
    username: { type: config.types.string },
    email: { type: config.types.string },
    email_verified: { type: config.types.boolean },
    phone: { type: config.types.string },
    role: { type: config.types.string },
    img: { type: config.types.string },
    ref_code: { type: config.types.string },
    ref_from: { type: config.types.string },
    api_key: { type: config.types.string },
    premium: { type: config.types.boolean },
    favs: { type: config.types.string },
  },
};

export default {
  user,
};
