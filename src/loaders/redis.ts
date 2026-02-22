'use strict';

// MODULES
import { createClient, RedisClientType } from 'redis';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

export async function load_redis(options: options_i): Promise<RedisClientType> {
  const client: RedisClientType = createClient();

  client.on('error', (err: any) => {
    console.info(
      `[  \x1b[31mERR\x1b[0m  ] Redis ${err.code} (PORT: \x1b[38;2;255;165;0m${err.port}\x1b[0m)\n`
    );
    console.info('            DEBUG: \x1b[1msystemctl status redis\x1b[0m\n');

    process.exit(1);
  });

  // redis configuration
  //await client.configSet('hz', '1');

  // connection
  await client.connect();

  // clean up
  await client.flushDb();
  await client.flushAll();

  const blockchains = [];
  for (let i: number = 0; i < config.blockchains.length; i++) {
    blockchains.push({
      id: config.blockchains[i].id,
      price: 0,
      name: config.blockchains[i].coin_name,
      symbol: config.blockchains[i].coin_symbol,
      img: config.blockchains[i].coin_img,
      url_explorer: config.blockchains[i].url_explorer,
    });
  }

  // TODO: configure the initial settings values
  const settings = {
    exchange: { USD: 1, AED: 3.6725, EUR: 0.8934, TRY: 42.7136 }, // doviz burosu
    blockchains: blockchains,
  };

  // validate redis properties
  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (typeof settings.blockchains[i].price !== config.type_number) {
      throw 'REDIS: INVALID PRICE ' + settings.blockchains[i].id.toUpperCase();
    }
  }

  await client.set('settings', JSON.stringify(settings));

  // dependency injection
  options.redis = client;

  return client;
}

export default load_redis;
