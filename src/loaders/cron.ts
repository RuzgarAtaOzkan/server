'use strict';

// MODULES
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { CronJob } from 'cron';
import axios from 'axios';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { sleep } from '../utils/common';

async function mongodb_backup(
  path: string = '/var/backups/' + config.ENV_DB_NAME,
): Promise<void> {
  if (fs.existsSync(path) === false) {
    fs.mkdirSync(path);
  }

  // name of the incoming backup folder (2025-04-01)
  const name: string = new Date().toISOString().split('T')[0];

  // previous backups
  const backups: string[] = fs.readdirSync(path);

  // sort by date
  for (let i: number = 0; i < backups.length; i++) {
    for (let j: number = 0; j < backups.length; j++) {
      if (backups[j + 1] === undefined) {
        continue;
      }

      const directory: boolean = fs
        .statSync(path + '/' + backups[j])
        .isDirectory();

      const directory_next: boolean = fs
        .statSync(path + '/' + backups[j + 1])
        .isDirectory();

      if (directory === false || directory_next === false) {
        continue;
      }

      if (
        new Date(backups[j]).toString() === 'Invalid Date' ||
        new Date(backups[j + 1]).toString() === 'Invalid Date'
      ) {
        continue;
      }

      const current: number = new Date(backups[j]).valueOf();
      const next: number = new Date(backups[j + 1]).valueOf();

      const current_name: string = backups[j];
      const next_name: string = backups[j + 1];

      if (current < next) {
        backups[j] = next_name;
        backups[j + 1] = current_name;
      }
    }
  }

  // remove backups older then 1 month
  const limit: number = 30;
  let limit_ctr: number = 0;

  for (let i: number = 0; i < backups.length; i++) {
    const directory: boolean = fs
      .statSync(path + '/' + backups[i])
      .isDirectory();

    if (directory === false) {
      continue;
    }

    if (new Date(backups[i]).toString() === 'Invalid Date') {
      continue;
    }

    if (limit_ctr >= limit) {
      fs.rmSync(path + '/' + backups[i], {
        recursive: true,
        force: true,
      });

      continue;
    }

    limit_ctr++;
  }

  // mongodump terminal command
  const command: string = `mongodump --db=${config.ENV_DB_NAME} --out=${
    path + '/' + name
  }`;

  // execute with node child process
  const stdout = execSync(command);

  // copy files from /var/backups/server/2025-04-01/server => /var/backups/server/2025-04-01
  const files = fs.readdirSync(path + '/' + name + '/' + config.ENV_DB_NAME);

  for (let i: number = 0; i < files.length; i++) {
    const source: string =
      path + '/' + name + '/' + config.ENV_DB_NAME + '/' + files[i];

    const destination: string = path + '/' + name + '/' + files[i];

    fs.copyFileSync(source, destination);
  }

  fs.rmSync(path + '/' + name + '/' + config.ENV_DB_NAME, {
    recursive: true,
    force: true,
  });
}

async function redis_update_exchange(options: options_i): Promise<void> {
  const settings = JSON.parse(await options.redis.get('settings'));

  const url: string =
    'https://v6.exchangerate-api.com/v6/' +
    config.ENV_API_KEY_EXCHANGE +
    '/latest/USD';
  const res = await axios.get(url);

  settings.exchange = res.data.conversion_rates;

  await options.redis.set('settings', JSON.stringify(settings));
}

async function redis_update_blockchain_prices(
  options: options_i,
): Promise<void> {
  const settings = JSON.parse(await options.redis.get('settings'));

  for (let i: number = 0; i < config.blockchains.length; i++) {
    const res = await axios.get(config.blockchains[i].url_binance_price);

    const price: number = Number(res.data.price);

    settings.blockchains[i].price = price;

    // await sleep(500);
  }

  await options.redis.set('settings', JSON.stringify(settings));
}

// execute blockchains all wallet_scan functions (wallet_scan, wallet_scan_withdraw, wallet_scan_refund) to scan & process for incoming transactions
async function wallet_scan(options: options_i): Promise<void> {
  const wallet_scan_promises: Promise<void>[] = [];

  for (let i: number = 0; i < config.blockchains.length; i++) {
    wallet_scan_promises.push(config.blockchains[i].wallet_scan(options));

    /*
    wallet_scan_promises.push(
      config.blockchains[i].wallet_scan_withdraw(options)
    );

    wallet_scan_promises.push(
      config.blockchains[i].wallet_scan_refund(options)
    );  
    */
  }

  await Promise.all(wallet_scan_promises);
}

// execute collected socket clients send function from options to prevent connection drops
function socket_ping(options: options_i): void {
  for (let i: number = 0; i < options.sockets.length; i++) {
    if (options.sockets[i].readyState !== WebSocket.OPEN) {
      continue;
    }

    options.sockets[i].send(
      JSON.stringify({
        jsonrpc: '2.0',
        method: 'ping',
        id: 1,
      }),
    );
  }
}

export async function load_cron(options: options_i) {
  let resolve: Function = function (code: number) {};

  const cron = {
    jobs: new Array(5), // we currently have 5 jobs
    open: function () {
      resolve = function () {};

      for (let i: number = 0; i < this.jobs.length; i++) {
        this.jobs[i].start();
      }
    },
    close: function () {
      for (let i: number = 0; i < this.jobs.length; i++) {
        this.jobs[i].stop();
      }

      return new Promise((res) => {
        for (let i: number = 0; i < this.jobs.length; i++) {
          if (this.jobs[i].finished === false) {
            resolve = res;
            return;
          }
        }

        res(0);
      });
    },
  };

  // every 9 seconds
  cron.jobs[0] = new CronJob('*/9 * * * * *', async function () {
    cron.jobs[0].finished = false;

    await Promise.all([
      redis_update_blockchain_prices(options),
      wallet_scan(options),
      socket_ping(options),
    ]);

    cron.jobs[0].finished = true;

    for (let i: number = 0; i < cron.jobs.length; i++) {
      if (cron.jobs[i].finished === false) {
        return;
      }
    }

    resolve(0);
  });

  // every minute
  cron.jobs[1] = new CronJob('59 * * * * *', async function () {
    cron.jobs[1].finished = false;

    await Promise.all([]);

    cron.jobs[1].finished = true;

    for (let i: number = 0; i < cron.jobs.length; i++) {
      if (cron.jobs[i].finished === false) {
        return;
      }
    }

    resolve(0);
  });

  // every hour
  cron.jobs[2] = new CronJob('00 59 * * * *', async function () {
    cron.jobs[2].finished = false;

    await Promise.all([]);

    cron.jobs[2].finished = true;

    for (let i: number = 0; i < cron.jobs.length; i++) {
      if (cron.jobs[i].finished === false) {
        return;
      }
    }

    resolve(0);
  });

  // every midnight (UTC)
  cron.jobs[3] = new CronJob('00 00 00 * * *', async function () {
    cron.jobs[3].finished = false;

    await Promise.all([mongodb_backup()]);

    cron.jobs[3].finished = true;

    for (let i: number = 0; i < cron.jobs.length; i++) {
      if (cron.jobs[i].finished === false) {
        return;
      }
    }

    resolve(0);
  });

  // every month (first day at 00:00)
  cron.jobs[4] = new CronJob('00 00 00 1 * *', async function () {
    cron.jobs[4].finished = false;

    await Promise.all([redis_update_exchange(options)]);

    cron.jobs[4].finished = true;

    for (let i: number = 0; i < cron.jobs.length; i++) {
      if (cron.jobs[i].finished === false) {
        return;
      }
    }

    resolve(0);
  });

  // redis_update_exchange(options);
  await redis_update_blockchain_prices(options);
  await wallet_scan(options);
  socket_ping(options);

  for (let i: number = 0; i < cron.jobs.length; i++) {
    cron.jobs[i].finished = true;
    cron.jobs[i].start();
  }

  return cron;
}

export default load_cron;
