'use strict';

// MODULES
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { CronJob } from 'cron';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

async function mongodb_backup(
  path: string = '/var/backups/' + config.ENV_DB_NAME
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

export function load_cron(options: options_i): void {
  // every 9 seconds
  new CronJob('*/9 * * * * *', function () {}).start();

  // every minute
  new CronJob('59 * * * * *', function () {}).start();

  // every hour
  new CronJob('00 59 * * * *', function () {}).start();

  // every midnight (UTC)
  new CronJob('00 00 00 * * *', function () {
    mongodb_backup();
  }).start();
}

export default load_cron;
