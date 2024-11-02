Features:

    Secure Cookie Authentication for User Communication
    Simple Admin-User Role System
    Simple User Reference System
    Media Upload through File System
    Scalable Code Architecture to Add-On

Prerequisites

    Linux distro
    redis service
    mongodb service
    smtp email account

Installation

# Linux package installations

$ sudo apt install redis
$ sudo apt install mongodb (you can use mongo atlas cloud as an alternative to mongodb package)

$ # sudo apt install nginx (optional but recommended)
$ # sudo npm install -g pm2 (optional but recommended)

# Project installation

$ git clone https://github.com/ruzgarataozkan/server.git
$ cd ./server
$ npm install
$ npm run build
$ npm run start

Then create a .env file in the root of the project and enter your environment values.

PORT=3001
HOST=127.0.0.1

NODE_ENV=prod

SESSION_SECRET=SECURE_RANDOM_STRING
SESSION_NAME=server_sid

DB_URL=YOUR_MONGODB_CONNECTION_STRING
DB_NAME=panpa

PERM_ADMIN=SECURE_RANDOM_STRING
PERM_USER=SECURE_RANDOM_STRING

EMAIL_HOST=smtp.gmail.com
EMAIL_USERNAME=mail@server.com
EMAIL_PASSWORD=123

URL_API=api.server.com
URL_UI=server.com

API_KEY_CAPTCHA=YOUR_HCAPTCHA_API_KEY

API_KEY_0X=YOUR_0X_API_KEY

API_KEY_ETHERSCAN=YOUR_ETHERSCAN_API_KEY
API_KEY_BSCSCAN=YOUR_BSCSCAN_API_KEY
API_KEY_ARBISCAN=YOUR_ARBISCAN_API_KEY
API_KEY_POLYGONSCAN=YOUR_POLYGONSCAN_API_KEY
API_KEY_FTMSCAN=YOUR_FTMSCAN_API_KEY
API_KEY_CELOSCAN=YOUR_CELOSCAN_API_KEY

API_KEY_INFURA=YOUR_INFURA_API_KEY
API_KEY_MORALIS=YOUR_MORALIS_API_KEY

Run start first to create the db collections then run your tests.

$ npm run build
$ npm run start

Documentation

All the pipelines are documented from entry point to exit of the program. Numbers in the titles represents the order of the pipelines and it goes in order.

1. Config Object
   Path: src/config/index.ts

'use strict';
