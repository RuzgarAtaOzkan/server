'use strict';

//  MODULES
import dotenv from 'dotenv';

// INTERFACES
import config_i from 'interfaces/config';

// Bind .env file to the process.env;
const env = dotenv.config();

if (env.error) {
  // This error should crash whole process
  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

const config: config_i = {
  endpoints: {
    // static
    static_images: '/images/:id',

    // auth
    auth_root: '/', // PUBLIC
    auth_profile: '/profile', // PUBLIC
    auth_signin: '/signin', // PUBLIC
    auth_signup: '/signup', // PUBLIC
    auth_signout: '/signout', // AUTH
    auth_email_verify: '/email-verify/:token', // PUBLIC
    auth_email_change: '/email-change', // AUTH
    auth_password_change: '/password-change', // AUTH
    auth_password_reset: '/password-reset/:token', // PUBLIC

    // emails
    mail_send_verification_link: '/email-send-verification-link', // AUTH
    mail_send_password_reset_link: '/email-send-password-reset-link', // PUBLIC

    // settings
    settings: '/settings', // PUBLIC
  },
  env: {
    PORT: process.env.PORT || '3001',
    PORT_SOCKET: process.env.PORT_SOCKET || '3002',

    HOST: process.env.HOST || '127.0.0.1',

    // serverside cookie session kaciriyosun_sid
    SESSION_SECRET: process.env.SESSION_SECRET || '',
    SESSION_NAME: process.env.SESSION_NAME || '',
    SESSION_LIFETIME_MS: 1000 * 60 * 60 * 24,

    DB_URL: process.env.DB_URL || '',
    DB_NAME: process.env.DB_NAME || '',

    ROLE_KEY_ADMIN: process.env.ROLE_KEY_ADMIN || '',
    ROLE_KEY_USER: process.env.ROLE_KEY_USER || '',

    EMAIL_HOST: process.env.EMAIL_HOST || '',
    EMAIL_USERNAME: process.env.EMAIL_USERNAME || '',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',

    URL_API: process.env.URL_API || '',
    URL_UI: process.env.URL_UI || '',

    // API KEYS
    API_KEY_CAPTCHA: process.env.API_KEY_CAPTCHA || '',

    API_KEY_0X: process.env.API_KEY_0X || '',

    API_KEY_MORALIS: process.env.API_KEY_MORALIS || '',

    API_KEY_ETHERSCAN: process.env.API_KEY_ETHERSCAN || '',
    API_KEY_BSCSCAN: process.env.API_KEY_BSCSCAN || '',
    API_KEY_ARBISCAN: process.env.API_KEY_ARBISCAN || '',
    API_KEY_POLYGONSCAN: process.env.API_KEY_POLYGONSCAN || '',
    API_KEY_FTMSCAN: process.env.API_KEY_FTMSCAN || '',
    API_KEY_CELOSCAN: process.env.API_KEY_CELOSCAN || '',
  },
  roles: {
    admin: 'admin',
    user: 'user',
  },
  times: {
    one_min_ms: 1000 * 60,
    one_hour_ms: 1000 * 60 * 60,
    one_day_ms: 1000 * 60 * 60 * 24,
  },
  types: {
    objectId: 'objectId',
    string: 'string',
    number: 'number',
    int: 'int',
    float: 'float',
    date: 'date',
    double: 'double',
    boolean: 'boolean',
    bool: 'bool',
    object: 'object',
    array: 'array',
    function: 'function',
    null: 'null',
    undefined: 'undefined',
  },

  blockchain_chains: {
    // Ethereum Mainnet
    '1': {
      name: 'Ethereum Mainnet',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'Ethereum',
      token_symbol: 'ETH',
      token_decimals: 18,
      token_img: '/images/ethereum.png',
      wrapped_address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      usdt_address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      usdt_decimals: 6,
      usdc_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      usdc_decimals: 6,
      dai_address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      dai_decimals: 18,
      url_explorer: 'https://etherscan.io',
      '0x_param': '',
    },

    // BSC
    '56': {
      name: 'BNB Smart Chain',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'BNB',
      token_symbol: 'BNB',
      token_decimals: 18,
      token_img: '/images/bnb.png',
      wrapped_address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      usdt_address: '0x55d398326f99059ff775485246999027b3197955',
      usdt_decimals: 18,
      usdc_address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      usdc_decimals: 18,
      dai_address: '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3',
      dai_decimals: 18,
      url_explorer: 'https://bscscan.com',
      '0x_param': 'bsc.',
    },

    // Polygon
    '137': {
      name: 'Polygon Mainnet',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'Polygon',
      token_symbol: 'POL',
      token_decimals: 18,
      token_img: '/images/polygon.png',
      wrapped_address: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      usdt_address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
      usdt_decimals: 6,
      usdc_address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      usdc_decimals: 6,
      dai_address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      dai_decimals: 18,
      url_explorer: 'https://polygonscan.com',
      '0x_param': 'polygon.',
    },

    // Fantom
    '250': {
      name: 'Fantom Mainnet',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'Fantom',
      token_symbol: 'FTM',
      token_decimals: 18,
      wrapped_address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
      usdt_address: '0x049d68029688eabf473097a2fc38ef61633a3c7a',
      usdt_decimals: 6,
      usdc_address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
      usdc_decimals: 6,
      dai_address: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E',
      dai_decimals: 18,
      url_explorer: 'https://ftmscan.com',
      '0x_param': 'fantom.',
    },

    // Arbitrum
    '42161': {
      name: 'Arbitrum Mainnet',
      token_img: '/images/arbitrum.png',
      token_address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      token_name: 'Arbitrum',
      token_symbol: 'ARB',
      token_decimals: 18,
      usdt_address: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
      usdt_decimals: 6,
      usdc_address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      usdc_decimals: 6,
      dai_address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
      dai_decimals: 18,
      url_explorer: 'https://arbiscan.io',
      '0x_param': 'arbitrum.',
    },

    // Celo
    '42220': {
      name: 'Celo Mainnet',
      token_img: '/images/celo.png',
      token_address: '0x471ece3750da237f93b8e339c536989b8978a438',
      token_name: 'Celo',
      token_symbol: 'CELO',
      token_decimals: 18,
      usdt_address: '',
      usdt_decimals: 0,
      usdc_address: '0x37f750b7cc259a2f741af45294f6a16572cf5cad',
      usdc_decimals: 6,
      dai_address: '',
      dai_decimals: 0,
      url_explorer: 'https://celoscan.io/',
      '0x_param': 'celo.',
    },

    // Avalanche
    '43114': {
      name: 'Avalanche Mainnet C-Chain',
      token_img: '/images/avalanche.png',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'Avalanche',
      token_symbol: 'AVAX',
      token_decimals: 18,
      wrapped_address: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
      usdt_address: '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7',
      usdt_decimals: 6,
      usdc_address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      usdc_decimals: 6,
      dai_address: '0xd586E7F844cEa2F87f50152665BCbc2C279D8d70',
      dai_decimals: 18,
      url_explorer: 'https://snowtrace.io/',
      '0x_param': 'avalanche.',
    },

    // Sepolia
    '11155111': {
      name: 'Sepolia Testnet',
      token_img: '/images/token.png',
      token_address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      token_name: 'Sepolia',
      token_symbol: 'SepoliaETH',
      token_decimals: 18,
      usdt_address: '0x7169d38820dfd117c3fa1f22a697dba58d90ba06',
      usdt_decimals: 6,
      url_explorer: 'https://sepolia.etherscan.io',
      '0x_param': 'sepolia.',
    },
  },
};

Object.freeze(config);

export default config;
