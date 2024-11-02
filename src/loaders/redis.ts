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

  let settings: string | null = await client.get('settings');

  if (!settings) {
    await client.set('settings', JSON.stringify({}));
  }

  options.redis = client;

  return client;
}

export default load_redis;
