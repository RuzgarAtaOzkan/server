'use strict';

// MODULES
import { createClient } from 'redis';

async function load_redis(options: any) {
  const client = createClient();

  client.on('error', (err: any) => {
    throw err;
  });

  await client.connect();

  await client.flushAll();
  await client.flushDb();

  const settings: string = JSON.stringify({
    location_price: 70, // ($)
    location_payment_address: '0x91f50347c7d1bd351bee7de3f60982cff0093b4d', // crypto wallet address to send money to
  });

  await client.set('settings', settings);

  options.redis = client;

  return client;
}

export default load_redis;
