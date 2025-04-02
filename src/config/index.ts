'use strict';

//  MODULES
import dotenv from 'dotenv';

// INTERFACES
import config_i from 'interfaces/config';

// UTILS
import { sysgmt } from '../utils/common';

// bind .env file to the process.env;
const env = dotenv.config();

if (env.error) {
  // this error should crash whole process
  throw 'CONFIG: ENV FILE ERROR';
}

// COMMON CONFIGURATION VALUES OF THE SYSTEM
const config: config_i = {
  // ENV
  ENV_PORT: Number(process.env.PORT) || 3001,
  ENV_PORT_SOCKET: Number(process.env.PORT_SOCKET) || 3002,

  ENV_HOST: process.env.HOST || '127.0.0.1',

  ENV_SESSION_SECRET: process.env.SESSION_SECRET || 'SECRET123',
  ENV_SESSION_NAME: process.env.SESSION_NAME || 'domain_sid',
  ENV_SESSION_LIFETIME_MS: 1000 * 60 * 60 * 24,

  ENV_DB_URL: process.env.DB_URL || 'mongodb://localhost:27017',
  ENV_DB_NAME: process.env.DB_NAME || 'domain',

  ENV_ROLE_KEY_USER: process.env.ROLE_KEY_USER || 'SECRET123',
  ENV_ROLE_KEY_ADMIN: process.env.ROLE_KEY_ADMIN || 'SECRET123',

  ENV_EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  ENV_EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'mail@domain.com',
  ENV_EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'SECRET123',

  ENV_URL_API: process.env.URL_API || 'https://api.domain.com',
  ENV_URL_UI: process.env.URL_UI || 'https://domain.com',
  ENV_URL_UI_LOCAL: process.env.URL_UI_LOCAL || 'http://localhost:3000',

  ENV_API_KEY_CAPTCHA: process.env.API_KEY_CAPTCHA || '',
  ENV_API_KEY_IYZICO: process.env.API_KEY_IYZICO || 'SECRET123',
  ENV_API_KEY_IYZICO_SECRET: process.env.API_KEY_IYZICO_SECRET || 'SECRET123',

  // ENDPOINTS

  // static
  endpoint_static_root: '/',
  endpoint_static_images_id: '/images/:id',
  // auth
  endpoint_user_profile: '/profile', // PUBLIC
  endpoint_user_signin: '/signin', // PUBLIC
  endpoint_user_signup: '/signup', // PUBLIC
  endpoint_user_signout: '/signout', // AUTH
  endpoint_user_email_verify: '/email-verify/:code', // PUBLIC
  endpoint_user_email_change: '/email-change', // AUTH
  endpoint_user_password_change: '/password-change', // AUTH
  endpoint_user_password_reset: '/password-reset', // PUBLIC
  // emails
  endpoint_mail_verification_link: '/mail-verification-link', // AUTH
  endpoint_mail_password_reset_link: '/mail-password-reset-link', // PUBLIC
  // settings
  endpoint_settings: '/settings', // PUBLIC
  endpoint_settings_cities: '/settings/cities', // PUBLIC
  endpoint_settings_districts: '/settings/districts', // PUBLIC
  endpoint_settings_neighbourhoods: '/settings/neighbourhoods', // PUBLIC
  // stores
  endpoint_stores: '/stores', // PUBLIC
  endpoint_stores_id: '/stores/:_id', // PUBLIC
  // products
  endpoint_products: '/products', // PUBLIC ?store_id=123
  // orders
  endpoint_orders: '/orders', // AUTH ?store_id=123
  endpoint_orders_delivery: '/orders/:code',
  // endpoint_orders_delivery: "/orders/delivery/:code"
  // coupons
  endpoint_cards: '/cards', // AUTH
  // coupons
  endpoint_coupons: '/coupons', // STORE

  // ROLES
  role_admin: 'admin',
  role_user: 'user',

  // TIMES
  time_gmt: sysgmt(), // system GMT
  time_one_min_ms: 1000 * 60,
  time_one_hour_ms: 1000 * 60 * 60,
  time_one_day_ms: 1000 * 60 * 60 * 24,

  // TYPES
  type_string: 'string',
  type_number: 'number',
  type_boolean: 'boolean',
  type_object: 'object',
  type_undefined: 'undefined',
  type_object_id: 'objectId',
  type_int: 'int',
  type_float: 'float',
  type_date: 'date',
  type_double: 'double',
  type_bool: 'bool',
  type_array: 'array',
  type_function: 'function',
  type_null: 'null',

  // BLOCKCHAIN
  blockchain_chains: {
    1: {
      name: 'Ethereum ERC20',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_address_wrapped: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      token_name: 'Ethereum',
      token_symbol: 'ETH',
      token_decimals: 18,
      token_img: '/images/ethereum.png',
      usdt_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      usdt_decimals: 6,
      usdc_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      usdc_decimals: 6,
      dai_address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      dai_decimals: 18,
      url_explorer: 'https://etherscan.io',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDC',
      '0x_param': '',
    },
    56: {
      name: 'Smart Chain BEP20',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_address_wrapped: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      token_name: 'BNB',
      token_symbol: 'BNB',
      token_decimals: 18,
      token_img: '/images/bnb.png',
      usdt_address: '0x55d398326f99059ff775485246999027b3197955',
      usdt_decimals: 18,
      usdc_address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      usdc_decimals: 18,
      dai_address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
      dai_decimals: 18,
      url_explorer: 'https://bscscan.com',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDC',
      '0x_param': 'bsc.',
    },
    137: {
      name: 'Polygon POS',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_address_wrapped: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      token_name: 'Polygon',
      token_symbol: 'POL',
      token_decimals: 18,
      token_img: '/images/polygon.png',
      usdt_address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      usdt_decimals: 6,
      usdc_address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      usdc_decimals: 6,
      dai_address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      dai_decimals: 18,
      url_explorer: 'https://polygonscan.com',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=POLUSDC',
      '0x_param': 'polygon.',
    },
  },
};

Object.freeze(config);

export default config;
