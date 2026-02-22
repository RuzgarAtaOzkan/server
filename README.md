# Fastify API Server

A **scalable**, **secure**, **production-grade e-commerce API server** built with **Node.js** and **Fastify**, designed to run as a **systemd service on Linux**.

The project focuses on **simplicity**, **reliability**, and **long-term maintainability**.
It intentionally avoids modern JavaScript over-engineering and unnecessary abstractions.

## Philosophy

This project follows a **strict**, **conservative coding style**:

- Strict equality only (`===`), no loose comparisons
- No JavaScript array helpers (`map`, `filter`, etc.), only explicit loops
- Minimal to zero OOP, mostly functional programming
- No unnecessary TypeScript interfaces or abstractions
- Clean, predictable naming conventions
- Simple and explicit dependency injection
- Clear separation of responsibilities between components
- Only official Node.js modules
- Only official RPC APIs

The goal is **boring**, **readable**, **auditable code** that behaves predictably in production.

## Features

- **Fastify** (instead of Express)
- **Systemd-managed service** (Linux only)
- **MongoDB** for persistent storage
- **Redis** for fast cookie-based authentication
- **Signup** / **email verification** / **password reset** etc...
- **Solana & Ethereum wallet generation** (no third-party libraries)
- **Solana & Ethereum payments** via fast RPC sockets
- **Garanti BBVA** payment integration
- **Exchange rate support**
- **hCaptcha** protection

---

## Requirements

⚠️ **Linux only**

This project is designed and tested exclusively on Linux systems.

### Node.js

- **Node.js v18 or later is required**

Check installation:

```sh
node -v
```

### System Dependencies

The following services must be installed **and running**:

- **MongoDB** (`mongod`)
- **Redis** (`redis-server`)

Check status:

```sh
systemctl status mongod
systemctl status redis-server
```

### System Configurations

This project requires a systemd service file in:

```sh
/etc/systemd/system/<project-name>.service
```

Where `<project-name>` matches the project directory name.

#### Example:

```ini
[Unit]
After=mongod.service redis-server.service
Requires=mongod.service redis-server.service

[Service]
WorkingDirectory=/path/to/project-name
ExecStart=/usr/bin/node build/index.js

[Install]
WantedBy=multi-user.target
```

### API Dependencies

You must obtain API keys for the following services:

- **Garanti BBVA**
- **ExchangeRate-API**
- **Helius** (Solana RPC API)
- **Infura** (Ethereum RPC API)
- **hCaptcha**

### Environment Variables

Replace `name` with your actual project name and fill all values correctly.

```env
# Fastify
HOST=127.0.0.1
PORT=3001
PORT_SOCKET=3002

# Session cookie (for authenticating the user)
COOKIE_NAME=name_sid

# MongoDB
DB_URL=mongodb://127.0.0.1:27017
DB_NAME=name

# User roles
ROLE_KEY_ADMIN=strong_random_value
ROLE_KEY_USER=strong_random_value

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_USERNAME=info@name.com
EMAIL_PASSWORD=123

# URL of the API (this app)
URL_API=https://api.name.com
# URL of the frontend, where the requests will come to this API from
URL_UI=https://name.com
# URL of the frontend localhost for testing
URL_UI_LOCAL=http://127.0.0.1:3000

# Required API keys

# https://dev.garantibbva.com.tr/sanalpos-satis-pesin-3dli
API_KEY_GARANTI=...
API_KEY_GARANTI_SWITCH=...
API_KEY_GARANTI_SWITCH_PASSWORD=...
API_KEY_GARANTI_MERCHANT=...
API_KEY_GARANTI_TERMINAL=...
API_KEY_GARANTI_USER=...
API_KEY_GARANTI_PASSWORD=...
API_KEY_GARANTI_STORE=...

# https://app.exchangerate-api.com
API_KEY_EXCHANGE=...

# https://www.helius.dev/
API_KEY_HELIUS=...

# https://www.infura.io/
API_KEY_INFURA=...

# https://www.hcaptcha.com/
# API_KEY_CAPTCHA=...
```

### Build Script

The `build.sh` script handles:

- Linux environment validation
- Service checks (`mongod`, `redis-server`)
- Dependency installation
- Build process
- Optional systemd start or restart

### Usage

In project's root:

```sh
sudo sh build.sh [options]
```

### Options

Build only:

```sh
sudo sh build.sh
```

Build and start the service:

```sh
sudo sh build.sh -s
```

Build and restart the service:

```sh
sudo sh build.sh -r
```

Show help message:

```sh
sudo sh build.sh -h
```

Run without systemd (development / debugging):

```sh
sudo sh build.sh && sudo npm run start
```
