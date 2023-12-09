# Installation

```bash
$ git clone https://github.com/RuzgarAtaOzkan/server.git
$ cd ./server
$ npm install
```

Then create a .env file in the root of the project and enter your environment values.

```.env
PORT=3000
HOST=127.0.0.1

NODE_ENV=prod

SESSION_SECRET=
SESSION_NAME=domain_sid

DB_CONN_STR=
DB_NAME=domain

PERM_ADMIN=123
PERM_USER=123

EMAIL_HOST=smtp.gmail.com
EMAIL_NO_REPLY_USERNAME=no-reply@domain.com
EMAIL_NO_REPLY_PASSWORD=

URL_API=api.domain.com
URL_UI=domain.com

IMAGEKIT_PUBLIC_KEY=public_123=
IMAGEKIT_PRIVATE_KEY=private_123=
IMAGEKIT_ID=123

SECRET_KEY_CAPTCHA=0x123

```

Run start first to create the db collections then run your tests.

```bash
$ npm run build
$ npm run start
```

# Documentation

All the pipelines are documented from entry point to exit of the program.
Numbers in the titles represents the order of the pipelines and it goes in order.

## 1. Config Object

### Path: src/config/index.ts

```javascript
'use strict';
```
