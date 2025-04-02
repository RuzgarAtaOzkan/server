'use strict';

// MODULES
import { createClient, RedisClientType } from 'redis';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

export async function load_redis(options: options_i) {
  const client: RedisClientType = createClient();

  client.on('error', (err: any) => {
    console.info(
      `[  \x1b[31mERROR\x1b[0m  ] Redis ${err.code} (PORT: \x1b[38;2;255;165;0m${err.port}\x1b[0m)\n`
    );
    console.info('            DEBUG: \x1b[1msystemctl status redis\x1b[0m\n');

    console.info(
      '            DESCRIPTION: Make sure "redis-server" package is installed and configured correctly on the system.'
    );
    console.info(
      '            You can install it with \x1b[1msudo apt install redis-server\x1b[0m\n'
    );

    process.exit(1);
  });

  // redis configuration
  //await client.configSet('hz', '1');

  // connection
  await client.connect();

  // clean up
  await client.flushDb();
  await client.flushAll();

  let settings: any | null = await client.get('settings');

  if (settings === null) {
    // TODO: configure the initial settings values
    settings = {
      // system GMT
      time_gmt: config.time_gmt,
    };

    await client.set('settings', JSON.stringify(settings));
  }

  options.redis = client;

  return client;
}

export default load_redis;
