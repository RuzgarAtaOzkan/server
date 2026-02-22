'use strict';

//  MODULES
import dotenv from 'dotenv';

// INTERFACES
import config_i from 'interfaces/config';

// UTILS
import { freeze, random, sysgmt } from '../utils/common';

import {
  socket_wallet_connect_solana,
  socket_wallet_connect_ethereum,
  socket_wallet_connect_bitcoin,
  cron_wallet_scan_solana,
  cron_wallet_scan_ethereum,
  cron_wallet_scan_bitcoin,
  cron_wallet_scan_withdraw_solana,
  cron_wallet_scan_withdraw_ethereum,
  cron_wallet_scan_withdraw_bitcoin,
  cron_wallet_scan_refund_solana,
  cron_wallet_scan_refund_ethereum,
  cron_wallet_scan_refund_bitcoin,
} from '../utils/loaders';

import {
  wallet_generate_solana,
  wallet_generate_ethereum,
  wallet_generate_bitcoin,
} from '../utils/services';

// bind .env file to the process.env;
const env = dotenv.config({ quiet: true });

if (env.error) {
  // this error should crash whole process
  throw 'CONFIG: ENV FILE ERROR';
}

// COMMON CONFIGURATION VALUES OF THE SYSTEM
const config: config_i = {
  // ENV
  ENV_HOST: process.env.HOST || '127.0.0.1',

  ENV_PORT: Number(process.env.PORT) || 3001,
  ENV_PORT_SOCKET: Number(process.env.PORT_SOCKET) || 3002,

  ENV_COOKIE_NAME: process.env.COOKIE_NAME || 'sid',
  ENV_COOKIE_LIFETIME_MS: 1000 * 60 * 60 * 24,

  ENV_DB_URL: process.env.DB_URL || 'mongodb://127.0.0.1:27017',
  ENV_DB_NAME: process.env.DB_NAME || 'server',

  ENV_ROLE_KEY_ADMIN: random() || process.env.ROLE_KEY_ADMIN || '',
  ENV_ROLE_KEY_USER: process.env.ROLE_KEY_USER || random(),

  ENV_EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  ENV_EMAIL_USERNAME: process.env.EMAIL_USERNAME || 'info@server.com',
  ENV_EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',

  ENV_URL_API: process.env.URL_API || 'https://api.server.com',
  ENV_URL_UI: process.env.URL_UI || 'https://server.com',
  ENV_URL_UI_LOCAL: process.env.URL_UI_LOCAL || 'http://127.0.0.1:3000',

  ENV_API_KEY_GARANTI: process.env.API_KEY_GARANTI || '',
  ENV_API_KEY_GARANTI_SWITCH: process.env.API_KEY_GARANTI_SWITCH || '',
  ENV_API_KEY_GARANTI_SWITCH_PASSWORD:
    process.env.API_KEY_GARANTI_SWITCH_PASSWORD || '',
  ENV_API_KEY_GARANTI_MERCHANT: process.env.API_KEY_GARANTI_MERCHANT || '',
  ENV_API_KEY_GARANTI_TERMINAL: process.env.API_KEY_GARANTI_TERMINAL || '',
  ENV_API_KEY_GARANTI_USER: process.env.API_KEY_GARANTI_USER || '',
  ENV_API_KEY_GARANTI_PASSWORD: process.env.API_KEY_GARANTI_PASSWORD || '',
  ENV_API_KEY_GARANTI_STORE: process.env.API_KEY_GARANTI_STORE || '',

  ENV_API_KEY_EXCHANGE: process.env.API_KEY_EXCHANGE || '',

  ENV_API_KEY_HELIUS: process.env.API_KEY_HELIUS || '',
  ENV_API_KEY_INFURA: process.env.API_KEY_INFURA || '',

  ENV_API_KEY_CAPTCHA: process.env.API_KEY_CAPTCHA || '',

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
  // cards
  endpoint_cards: '/cards', // AUTH
  // products
  endpoint_products: '/products', // PUBLIC
  endpoint_products_id: '/products/:_id',
  // orders
  endpoint_orders: '/orders', // AUTH ?store_id=123
  endpoint_orders_delivery: '/orders/:code',
  // endpoint_orders_delivery: "/orders/delivery/:code"
  // provisions
  endpoint_provisions: '/provisions',
  endpoint_provisions_payments: '/provisions/payments',
  // wallets
  endpoint_wallets: '/wallets',
  // coupons
  endpoint_coupons: '/coupons', // STORE
  // reviews
  endpoint_reviews: '/reviews',
  // admin
  endpoint_admin_mail_send: '/admin/mail-send',
  endpoint_admin_settings: '/admin/settings',
  endpoint_admin_products: '/admin/products',
  endpoint_admin_wallets: '/admin/wallets',
  endpoint_admin_coupons: '/admin/coupons',

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

  // BLOCKCHAINS
  blockchains: [
    {
      id: 'solana',

      coin_address: 'So11111111111111111111111111111111111111112',
      coin_address_wrapped: 'So11111111111111111111111111111111111111112',
      coin_name: 'Solana',
      coin_symbol: 'SOL',
      coin_decimals: 9,
      coin_img: '/images/solana.png',

      usdt_address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      usdt_decimals: 6,
      usdc_address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      usdc_decimals: 6,

      url_explorer: 'https://solscan.io',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDC',
      url_rpc:
        'https://devnet.helius-rpc.com/?api-key=' + process.env.API_KEY_HELIUS,
      url_rpc_ws:
        'wss://devnet.helius-rpc.com/?api-key=' + process.env.API_KEY_HELIUS,

      // https://mainnet.helius-rpc.com
      // wss://mainnet.helius-rpc.com

      // methods
      wallet_generate: wallet_generate_solana, // service
      wallet_scan: cron_wallet_scan_solana, // cron job
      wallet_scan_withdraw: cron_wallet_scan_withdraw_solana, // cron job
      wallet_scan_refund: cron_wallet_scan_refund_solana, // cron job
      socket_connect: socket_wallet_connect_solana, // socket init
    },
    {
      id: 'ethereum',

      coin_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      coin_address_wrapped: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      coin_name: 'Ethereum',
      coin_symbol: 'ETH',
      coin_decimals: 18,
      coin_img: '/images/ethereum.png',

      usdt_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      usdt_decimals: 6,
      usdc_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      usdc_decimals: 6,

      url_explorer: 'https://etherscan.io',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDC',
      url_rpc: 'https://sepolia.infura.io/v3/' + process.env.API_KEY_INFURA,
      url_rpc_ws: 'wss://sepolia.infura.io/ws/v3/' + process.env.API_KEY_INFURA,

      // 'https://mainnet.infura.io/v3/' + process.env.API_KEY_INFURA
      // 'wss://mainnet.infura.io/ws/v3/' + process.env.API_KEY_INFURA,

      // methods
      wallet_generate: wallet_generate_ethereum,
      wallet_scan: cron_wallet_scan_ethereum,
      wallet_scan_withdraw: cron_wallet_scan_withdraw_ethereum,
      wallet_scan_refund: cron_wallet_scan_withdraw_ethereum,
      socket_connect: socket_wallet_connect_ethereum,
    },
    /*
    {
      id: 'bitcoin',

      coin_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      coin_address_wrapped: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      coin_name: 'Bitcoin',
      coin_symbol: 'BTC',
      coin_decimals: 18,
      coin_img: '/images/bitcoin.png',

      usdt_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      usdt_decimals: 6,
      usdc_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      usdc_decimals: 6,

      url_explorer: 'https://btcscan.com',
      url_binance_price:
        'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDC',
      url_rpc: 'https://sepolia.infura.io/v3/' + process.env.API_KEY_INFURA,
      url_rpc_ws: 'wss://sepolia.infura.io/ws/v3/' + process.env.API_KEY_INFURA,

      // 'https://mainnet.infura.io/v3/' + process.env.API_KEY_INFURA
      // 'wss://mainnet.infura.io/ws/v3/' + process.env.API_KEY_INFURA,

      // methods
      wallet_generate: wallet_generate_ethereum,
      wallet_scan: cron_wallet_scan_ethereum,
      wallet_scan_withdraw: cron_wallet_scan_withdraw_ethereum,
      wallet_scan_refund: cron_wallet_scan_withdraw_ethereum,
      socket_connect: socket_wallet_connect_ethereum,
    },
    */
  ],
};

freeze(config);

export default config;
