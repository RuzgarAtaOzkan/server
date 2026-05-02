'use strict';

// MODULES
import axios from 'axios';
import WebSocket from 'ws';

// CONFIG
import config from '../config';

// INTERFACES
import { Document, InsertOneResult, ObjectId, UpdateResult } from 'mongodb';
import { options_i } from 'interfaces/common';
import { blockchain_i } from 'interfaces/config';

// UTILS
import { sleep, base58_decode, fixd } from '../utils/common';
import { order_create_doc } from '../utils/services';
import * as ed25519 from './crypto/ed25519';
import * as secp256k1 from './crypto/secp256k1';
import * as sha3 from './crypto/sha3';

export async function socket_wallet_connect_solana(
  options: options_i,
): Promise<void> {
  const id: string = 'solana';

  let blockchain: blockchain_i | any = null;

  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  const socket: WebSocket | any = new WebSocket(blockchain.url_rpc_ws);

  socket.blockchain = id;

  socket.on('error', console.error);

  socket.on('open', function () {});

  socket.on('message', async function (message: string): Promise<void> {
    const data = JSON.parse(message);

    if (data.error) {
      return;
    }

    // accountUnsubscribe response from socket.send()
    if (data.result === true || data.result === false) {
      await options.db.wallets.updateOne(
        { _id: ObjectId.createFromHexString(data.id) },
        { $unset: { helius_subscription: 1 } },
      );

      return;
    }

    // accountSubscribe response from wallet_create
    if (data.result) {
      await options.db.wallets.updateOne(
        { _id: ObjectId.createFromHexString(data.id) },
        { $set: { helius_subscription: data.result } },
      );

      return;
    }

    // data.method === 'accountNotification'

    const wallet: Document = await options.db.wallets.findOne({
      helius_subscription: data.params.subscription,
    });

    const expired: boolean =
      Date.now() - wallet.updated_at.valueOf() > config.time_one_hour_ms;

    let amount: number = data.params.result.value.lamports;
    for (let i: number = 0; i < blockchain.coin_decimals; i++) {
      amount = amount / 10;
    }

    if (amount === 0) {
      if (expired) {
        options.db.wallets.deleteOne({ _id: wallet._id, status: 0 });

        // unsubscribe that public key from websocket
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: wallet._id.toString(),
            method: 'accountUnsubscribe',
            params: [wallet.helius_subscription],
          }),
        );
      }

      return;
    }

    if (amount < wallet.amount) {
      // TODO: refund manually then delete this wallet

      if (expired) {
        options.db.wallets.updateOne(
          { _id: wallet._id, status: 0 },
          { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
        );

        // unsubscribe that public key from websocket
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: wallet._id.toString(),
            method: 'accountUnsubscribe',
            params: [wallet.helius_subscription],
          }),
        );
      }

      return;
    }

    // lock the wallet to status 1
    const wallet_update: UpdateResult = await options.db.wallets.updateOne(
      { _id: wallet._id, status: 0 },
      { $set: { status: 1 } },
    );

    // prevents concurrent validation of a wallet (scan & socket) thus causing inserting multiple same orders
    if (wallet_update.modifiedCount === 0) {
      return;
    }

    wallet.basket = JSON.parse(wallet.basket);

    for (let i: number = 0; i < wallet.basket.length; i++) {
      const product_update: UpdateResult = await options.db.products.updateOne(
        {
          _id: ObjectId.createFromHexString(wallet.basket[i]._id),
          quantity: { $gte: wallet.basket[i].quantity },
        },
        { $inc: { quantity: -wallet.basket[i].quantity } },
      );

      if (product_update.modifiedCount === 0) {
        for (let j: number = 0; j < i; j++) {
          options.db.products.updateOne(
            {
              _id: ObjectId.createFromHexString(wallet.basket[j]._id),
            },
            { $inc: { quantity: wallet.basket[j].quantity } },
          );
        }

        options.db.wallets.updateOne(
          { _id: wallet._id, status: 1 },
          { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
        );

        // unsubscribe that public key from websocket
        socket.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: wallet._id.toString(),
            method: 'accountUnsubscribe',
            params: [wallet.helius_subscription],
          }),
        );

        // TODO: notify user that their order will be refunded back to them because of the inconsistencies of the qauntites of the products

        return;
      }
    }

    const order: Document = order_create_doc(wallet);
    await options.db.orders.insertOne(order);

    // unsubscribe the public key from websocket
    socket.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: wallet._id.toString(),
        method: 'accountUnsubscribe',
        params: [wallet.helius_subscription],
      }),
    );

    /*
    {
      "jsonrpc": "2.0",
      "method": "accountNotification",
      "params": {
        "result": {
          "context": {
            "slot": 5199307
          },
          "value": {
            "data": [
              "11116bv5nS2h3y12kD1yUKeMZvGcKLSjQgX6BeV7u1FrjeJcKfsHPXHRDEHrBesJhZyqnnq9qJeUuF7WHxiuLuL5twc38w2TXNLxnDbjmuR",
              "base58"
            ],
            "executable": false,
            "lamports": 33594,
            "owner": "11111111111111111111111111111111",
            "rentEpoch": 635,
            "space": 80
          }
        },
        "subscription": 23784
      }
    }
    */
  });

  socket.on('close', function (data: any) {
    socket_wallet_connect_solana(options);
  });

  // [WebSocket(solana), WebSocket(ethereum), WebSocket(bitcoin)]
  for (let i: number = 0; i < options.sockets.length; i++) {
    if (options.sockets[i].blockchain === id) {
      options.sockets[i] = socket;
      return; // avoid pushing new socket to the sockets array in options
    }
  }

  options.sockets.push(socket);
}

export async function socket_wallet_connect_ethereum(
  options: options_i,
): Promise<void> {
  const id: string = 'ethereum';

  let blockchain: blockchain_i | any = null;

  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  const socket: WebSocket | any = new WebSocket(blockchain.url_rpc_ws);

  socket.blockchain = id;

  socket.on('error', console.error);

  socket.on('open', function () {
    socket.send(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_subscribe',
        params: ['newHeads'],
      }),
    );
  });

  socket.on('message', async function (message: string): Promise<void> {
    /*
    sample incoming websocket message from eth_subscribe (newHeads)
    {
      "jsonrpc": "2.0",
      "method": "eth_subscription",
      "params": {
        "subscription": "0x1234...",
        "result": {
          "number": "0x5bad55",
          "hash": "0xabc...",
          ...
        }
      }
    }
    */

    const data = JSON.parse(message);

    if (data.error) {
      return;
    }

    // accountSubscribe response from wallet_create
    if (data.result) {
      return;
    }

    const res_block = await axios.post(blockchain.url_rpc, {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getBlockByHash',
      params: [data.params.result.hash, true],
    });

    /*
    sample HTTP RPC getBlockByHash response
    {
      "jsonrpc": "2.0",
      "id": 1,
      "result": {
        "number": "0x10fb78",
        "hash": "0x123...",
        "nonce": "0x0000000000000000",
        "gasLimit": "0x1c9c380",
        "gasUsed": "0x15f90",
        "timestamp": "0x663bce84",
        "transactions": [
          {
            "hash": "0xabcdef123...",
            "nonce": "0x10",
            "from": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            "to": "0x53d284357ec70cE289D6D64134DfAc8E511c8a3D",
            "value": "0x2386f26fc10000",  // 0.01 ETH in wei
            "gas": "0x5208",
            "gasPrice": "0x4a817c800",
          }
        ]
      }
    }
    */

    const transactions: any[] = res_block.data.result.transactions;

    const accounts: string[] = [];
    for (let i: number = 0; i < transactions.length; i++) {
      if (transactions[i].to === null) {
        accounts.push('');
        continue;
      }

      accounts.push(transactions[i].to.toLowerCase());
    }

    const wallets: Document[] = await options.db.wallets
      .find({ public: { $in: accounts }, status: 0 })
      .limit(256)
      .toArray();

    for (let i: number = 0; i < wallets.length; i++) {
      for (let j: number = 0; j < transactions.length; j++) {
        if (transactions[j].to === null) {
          continue;
        }

        if (wallets[i].public !== transactions[j].to.toLowerCase()) {
          continue;
        }

        const expired: boolean =
          Date.now() - wallets[i].updated_at.valueOf() >
          config.time_one_hour_ms;

        let amount: number = parseInt(transactions[j].value, 16);
        for (let k: number = 0; k < blockchain.coin_decimals; k++) {
          amount = amount / 10;
        }

        if (amount === 0) {
          if (expired) {
            options.db.wallets.deleteOne({ _id: wallets[i]._id, status: 0 });
          }

          break;
        }

        if (amount < wallets[i].amount) {
          // TODO: refund manually then delete this wallet

          if (expired) {
            options.db.wallets.updateOne(
              { _id: wallets[i]._id, status: 0 },
              { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
            );
          }

          break;
        }

        // lock the wallet to status 1
        const wallet_update: UpdateResult = await options.db.wallets.updateOne(
          { _id: wallets[i]._id, status: 0 },
          { $set: { status: 1 } },
        );

        // prevents concurrent validation of a wallet (scan & socket) thus causing inserting multiple same orders
        if (wallet_update.modifiedCount === 0) {
          break;
        }

        wallets[i].basket = JSON.parse(wallets[i].basket);

        let product_update_err: boolean = false;
        for (let k: number = 0; k < wallets[i].basket.length; k++) {
          const product_update: UpdateResult =
            await options.db.products.updateOne(
              {
                _id: ObjectId.createFromHexString(wallets[i].basket[k]._id),
                quantity: { $gte: wallets[i].basket[k].quantity },
              },
              { $inc: { quantity: -wallets[i].basket[k].quantity } },
            );

          if (product_update.modifiedCount === 0) {
            for (let l: number = 0; l < k; l++) {
              options.db.products.updateOne(
                {
                  _id: ObjectId.createFromHexString(wallets[i].basket[l]._id),
                },
                { $inc: { quantity: wallets[i].basket[l].quantity } },
              );
            }

            // TODO: refund the wallets[i] back to user

            options.db.wallets.updateOne(
              { _id: wallets[i]._id, status: 1 },
              { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
            );

            break;
          }
        }
        if (product_update_err) {
          break;
        }

        const order: Document = order_create_doc(wallets[i]);
        await options.db.orders.insertOne(order);

        break;
      }
    }
  });

  socket.on('close', function (data: any) {
    socket_wallet_connect_ethereum(options);
  });

  // [WebSocket(solana), WebSocket(ethereum), WebSocket(bitcoin)]
  for (let i: number = 0; i < options.sockets.length; i++) {
    if (options.sockets[i].blockchain === id) {
      options.sockets[i] = socket;
      return; // avoid pushing new socket to the sockets array in options
    }
  }

  options.sockets.push(socket);
}

export async function socket_wallet_connect_bitcoin(
  options: options_i,
): Promise<void> {
  const id: string = 'bitcoin';

  let blockchain: blockchain_i | any = null;
  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
    }
  }
}

// scans the whole database for an incoming transactions as chunks for 1 time with the given limit then breaks and stops execution
// [wallet, wallet] [wallet, wallet] [wallet] (break while loop)
export async function cron_wallet_scan_solana(
  options: options_i,
): Promise<void> {
  const id: string = 'solana'; // blockchain id
  const settings = JSON.parse(await options.redis.get('settings'));

  let blockchain: blockchain_i | any = null;
  let blockchain_price: number = 0;
  let socket: WebSocket | any = null;

  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (settings.blockchains[i].id === id) {
      blockchain_price = settings.blockchains[i].price;
      break;
    }
  }

  for (let i: number = 0; i < options.sockets.length; i++) {
    if (options.sockets[i].blockchain === id) {
      socket = options.sockets[i];
      break;
    }
  }

  const limit: number = 128; // chunk size
  let skip: number = 0;

  while (true) {
    const wallets: Document[] = await options.db.wallets
      .find({ blockchain: id, status: 0 })
      .limit(limit)
      .skip(skip)
      .toArray();

    // configurations of the wallet docs (extracting public addresses, parsing basket, updating amount on an interval)
    const publics: string[] = [];
    for (let i: number = 0; i < wallets.length; i++) {
      publics.push(wallets[i].public);

      wallets[i].basket = JSON.parse(wallets[i].basket);

      // 10 minutes passed without updating the amount
      const update_amount: boolean =
        Date.now() - wallets[i].created_at.valueOf() >
        config.time_one_min_ms * 10;

      if (update_amount) {
        let price: number = 0; // total price of the current basket
        for (let j: number = 0; j < wallets[i].basket.length; j++) {
          price += wallets[i].basket[j].price;
        }

        let amount: number = price / blockchain_price;
        amount = fixd(amount, blockchain_price); // remove dust money

        options.db.wallets.updateOne(
          { _id: wallets[i]._id },
          { $set: { amount: amount, created_at: new Date() } },
        );
      }
    }

    const res = await axios.post(
      blockchain.url_rpc,
      {
        jsonrpc: '2.0',
        id: 1,
        method: 'getMultipleAccounts',
        params: [publics],
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    for (let i: number = 0; i < res.data.result.value.length; i++) {
      // validate current wallet to see if it is idle and waiting for deletion or waiting for price update

      // expiration gap duration should be specific to the blockchain because every blockchain has a different transaction confirmation duration
      const expired: boolean =
        Date.now() - wallets[i].updated_at.valueOf() > config.time_one_hour_ms;

      const account: any | null = res.data.result.value[i];

      if (account === null) {
        if (expired) {
          // delete idle wallets
          options.db.wallets.deleteOne({ _id: wallets[i]._id });

          // unsubscribe that public key from websocket
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: wallets[i]._id.toString(),
              method: 'accountUnsubscribe',
              params: [wallets[i].helius_subscription],
            }),
          );
        }

        continue;
      }

      let amount: number = account.lamports;
      for (let i = 0; i < blockchain.coin_decimals; i++) {
        amount = amount / 10;
      }

      /*
      if (amount === 0) {
        if (expired) {
          // delete idle wallets
          options.db.wallets.deleteOne({ _id: wallets[i]._id });

          // unsubscribe that public key from websocket
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: wallets[i]._id.toString(),
              method: 'accountUnsubscribe',
              params: [wallets[i].helius_subscription],
            })
          );
        }

        continue;
      }
      */

      if (amount < wallets[i].amount) {
        // TODO: refund then delete

        if (expired) {
          options.db.wallets.updateOne(
            { _id: wallets[i]._id, status: 0 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );

          // unsubscribe that public key from websocket
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: wallets[i]._id.toString(),
              method: 'accountUnsubscribe',
              params: [wallets[i].helius_subscription],
            }),
          );
        }

        continue;
      }

      // lock the wallet to status 1
      const wallet_update: UpdateResult = await options.db.wallets.updateOne(
        { _id: wallets[i]._id, status: 0 },
        { $set: { status: 1 } },
      );

      // prevents concurrent validation of a wallet (scan & socket) thus causing inserting multiple same orders
      if (wallet_update.modifiedCount === 0) {
        continue;
      }

      // update product quantities, if couldn't, recover the ones that changed back to the original quantity
      let product_update_err: boolean = false;
      for (let j: number = 0; j < wallets[i].basket.length; j++) {
        const product_update: UpdateResult =
          await options.db.products.updateOne(
            {
              _id: ObjectId.createFromHexString(wallets[i].basket[j]._id),
              quantity: { $gte: wallets[i].basket[j].quantity },
            },
            { $inc: { quantity: -wallets[i].basket[j].quantity } },
          );

        if (product_update.modifiedCount === 0) {
          for (let k: number = 0; k < j; k++) {
            options.db.products.updateOne(
              {
                _id: ObjectId.createFromHexString(wallets[i].basket[k]._id),
              },
              { $inc: { quantity: wallets[i].basket[k].quantity } },
            );
          }

          options.db.wallets.updateOne(
            { _id: wallets[i]._id, status: 1 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );

          // unsubscribe that public key from websocket
          socket.send(
            JSON.stringify({
              jsonrpc: '2.0',
              id: wallets[i]._id.toString(),
              method: 'accountUnsubscribe',
              params: [wallets[i].helius_subscription],
            }),
          );

          product_update_err = true;

          break;
        }
      }
      if (product_update_err) {
        // TODO: notify user that something went wrong while processing their basket products

        continue;
      }

      const order: Document = order_create_doc(wallets[i]);
      await options.db.orders.insertOne(order);

      // TODO: notify user by sending email and sms regarding to their orders

      // unsubscribe that public key from websocket
      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: wallets[i]._id.toString(),
          method: 'accountUnsubscribe',
          params: [wallets[i].helius_subscription],
        }),
      );
    }

    if (wallets.length < limit) {
      wallets.length = 0; // (optional) to help garbage collection
      break;
    }

    skip += limit;
  }
}

export async function cron_wallet_scan_ethereum(
  options: options_i,
): Promise<void> {
  const id: string = 'ethereum'; // blockchain id
  const settings = JSON.parse(await options.redis.get('settings'));

  let blockchain: blockchain_i | any = null;
  let blockchain_price: number = 0;

  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (settings.blockchains[i].id === id) {
      blockchain_price = settings.blockchains[i].price;
      break;
    }
  }

  const limit: number = 128; // chunk size
  let skip: number = 0;

  while (true) {
    const wallets: Document[] = await options.db.wallets
      .find({ blockchain: id, status: 0 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const body = [];
    for (let i: number = 0; i < wallets.length; i++) {
      body.push({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [wallets[i].public, 'latest'],
        id: i + 1, // super important to decide wallet index because infura rpc doesn't guarantee array allignment with request array
      });

      wallets[i].basket = JSON.parse(wallets[i].basket);

      // 10 minutes passed without updating the amount
      const update_amount: boolean =
        Date.now() - wallets[i].created_at.valueOf() >
        config.time_one_min_ms * 10;

      if (update_amount) {
        let price: number = 0; // total price of the current basket
        for (let j: number = 0; j < wallets[i].basket.length; j++) {
          price += wallets[i].basket[j].price;
        }

        let amount: number = price / blockchain_price;
        amount = fixd(amount, blockchain_price); // remove dust money

        options.db.wallets.updateOne(
          { _id: wallets[i]._id },
          { $set: { amount: amount, created_at: new Date() } },
        );
      }
    }

    // rpc response
    const res = await axios.post(blockchain.url_rpc, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    for (let i: number = 0; i < res.data.length; i++) {
      // validate current wallet to see if it is idle and waiting for deletion or waiting for price update

      const index: number = res.data[i].id - 1; // wallet index

      const expired: boolean =
        Date.now() - wallets[index].updated_at.valueOf() >
        config.time_one_hour_ms;

      let amount: number = parseInt(res.data[i].result, 16);
      for (let i: number = 0; i < blockchain.coin_decimals; i++) {
        amount = amount / 10;
      }

      if (amount === 0) {
        if (expired) {
          options.db.wallets.deleteOne({ _id: wallets[index]._id });
        }

        continue;
      }

      if (amount < wallets[index].amount) {
        if (expired) {
          options.db.wallets.updateOne(
            { _id: wallets[index]._id, status: 0 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );
        }

        continue;
      }

      // lock the wallet to status 1
      const wallet_update: UpdateResult = await options.db.wallets.updateOne(
        { _id: wallets[index]._id, status: 0 },
        { $set: { status: 1 } },
      );

      // prevents concurrent validation of a wallet (scan & socket) thus causing inserting multiple same orders
      if (wallet_update.modifiedCount === 0) {
        continue;
      }

      // update product quantities, if couldn't, recover the ones that changed back to the original quantity
      let product_update_err: boolean = false;
      for (let j: number = 0; j < wallets[index].basket.length; j++) {
        const product_update: UpdateResult =
          await options.db.products.updateOne(
            {
              _id: ObjectId.createFromHexString(wallets[index].basket[j]._id),
              quantity: { $gte: wallets[index].basket[j].quantity },
            },
            { $inc: { quantity: -wallets[index].basket[j].quantity } },
          );

        if (product_update.modifiedCount === 0) {
          for (let k: number = 0; k < j; k++) {
            await options.db.products.updateOne(
              {
                _id: ObjectId.createFromHexString(wallets[index].basket[k]._id),
              },
              { $inc: { quantity: wallets[index].basket[k].quantity } },
            );
          }

          options.db.wallets.updateOne(
            { _id: wallets[index]._id, status: 1 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );

          product_update_err = true;

          break;
        }
      }
      if (product_update_err) {
        continue;
      }

      const order: Document = order_create_doc(wallets[index]);
      await options.db.orders.insertOne(order);
    }

    if (wallets.length < limit) {
      wallets.length = 0; // (optional) to help garbage collection
      break;
    }

    skip += limit;
  }
}

export async function cron_wallet_scan_bitcoin(
  options: options_i,
): Promise<void> {
  const id: string = 'bitcoin'; // blockchain id
  const settings = JSON.parse(await options.redis.get('settings'));

  let blockchain: blockchain_i | any = null;
  let blockchain_price: number = 0;

  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  for (let i: number = 0; i < settings.blockchains.length; i++) {
    if (settings.blockchains[i].id === id) {
      blockchain_price = settings.blockchains[i].price;
      break;
    }
  }

  const limit: number = 128; // chunk size
  let skip: number = 0;

  while (true) {
    const wallets: Document[] = await options.db.wallets
      .find({ blockchain: id, status: 0 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const body = [];
    for (let i: number = 0; i < wallets.length; i++) {
      body.push({
        jsonrpc: '2.0',
        method: 'btc_getBalance',
        params: [wallets[i].public, 'latest'],
        id: i + 1, // super important to decide wallet index because infura rpc doesn't guarantee array allignment with request array
      });

      wallets[i].basket = JSON.parse(wallets[i].basket);

      // 10 minutes passed without updating the amount
      const update_amount: boolean =
        Date.now() - wallets[i].created_at.valueOf() >
        config.time_one_min_ms * 10;

      if (update_amount) {
        let price: number = 0; // total price of the current basket
        for (let j: number = 0; j < wallets[i].basket.length; j++) {
          price += wallets[i].basket[j].price;
        }

        const amount: number = price / blockchain_price;

        options.db.wallets.updateOne(
          { _id: wallets[i]._id },
          { $set: { amount: amount, created_at: new Date() } },
        );
      }
    }

    // rpc response
    const res = await axios.post(blockchain.url_rpc, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    for (let i: number = 0; i < res.data.length; i++) {
      // validate current wallet to see if it is idle and waiting for deletion or waiting for price update

      const index: number = res.data[i].id - 1; // wallet index

      const expired: boolean =
        Date.now() - wallets[index].updated_at.valueOf() >
        config.time_one_hour_ms;

      let amount: number = parseInt(res.data[i].result, 16);
      for (let i: number = 0; i < blockchain.coin_decimals; i++) {
        amount = amount / 10;
      }

      if (amount === 0) {
        if (expired) {
          options.db.wallets.deleteOne({ _id: wallets[index]._id });
        }

        continue;
      }

      if (amount < wallets[index].amount) {
        if (expired) {
          options.db.wallets.updateOne(
            { _id: wallets[index]._id, status: 0 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );
        }

        continue;
      }

      // lock the wallet to status 1
      const wallet_update: UpdateResult = await options.db.wallets.updateOne(
        { _id: wallets[index]._id, status: 0 },
        { $set: { status: 1 } },
      );

      // prevents concurrent validation of a wallet (scan & socket) thus causing inserting multiple same orders
      if (wallet_update.modifiedCount === 0) {
        continue;
      }

      // update product quantities, if couldn't, recover the ones that changed back to the original quantity
      let product_update_err: boolean = false;
      for (let j: number = 0; j < wallets[index].basket.length; j++) {
        const product_update: UpdateResult =
          await options.db.products.updateOne(
            {
              _id: ObjectId.createFromHexString(wallets[index].basket[j]._id),
              quantity: { $gte: wallets[index].basket[j].quantity },
            },
            { $inc: { quantity: -wallets[index].basket[j].quantity } },
          );

        if (product_update.modifiedCount === 0) {
          for (let k: number = 0; k < j; k++) {
            await options.db.products.updateOne(
              {
                _id: ObjectId.createFromHexString(wallets[index].basket[k]._id),
              },
              { $inc: { quantity: wallets[index].basket[k].quantity } },
            );
          }

          options.db.wallets.updateOne(
            { _id: wallets[index]._id, status: 1 },
            { $set: { status: -1 }, $unset: { helius_subscription: 1 } },
          );

          product_update_err = true;

          break;
        }
      }
      if (product_update_err) {
        continue;
      }

      const order: Document = order_create_doc(wallets[index]);
      await options.db.orders.insertOne(order);
    }

    if (wallets.length < limit) {
      wallets.length = 0; // (optional) to help garbage collection
      break;
    }

    skip += limit;
  }
}

// withdraw the balance to our personal main wallet
export async function cron_wallet_scan_withdraw_solana(
  options: options_i,
): Promise<void> {
  return;

  const id: string = 'solana';

  let blockchain: blockchain_i | any = null;
  for (let i: number = 0; i < config.blockchains.length; i++) {
    if (config.blockchains[i].id === id) {
      blockchain = config.blockchains[i];
      break;
    }
  }

  // 1. Get recent blockhash
  const res_blockhash: any = await axios.post(
    blockchain.url_rpc,
    {
      jsonrpc: '2.0',
      id: 1,
      method: 'getLatestBlockhash',
    },
    { headers: { 'Content-Type': 'application/json' } },
  );
  const blockhash: Uint8Array = base58_decode(
    res_blockhash.data.result.value.blockhash,
  );

  const limit: number = 32; // chunk size
  let skip: number = 0;

  while (true) {
    const wallets: Document[] = await options.db.wallets
      .find({ blockchain: id, status: 1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    const publics: string[] = [];
    for (let i: number = 0; i < wallets.length; i++) {
      publics.push(wallets[i].public);
    }

    const res_accounts = await axios.post(
      blockchain.url_rpc,
      {
        jsonrpc: '2.0',
        id: '1',
        method: 'getMultipleAccounts',
        params: [publics],
      },
      { headers: { 'Content-Type': 'application/json' } },
    );

    for (let i: number = 0; i < res_accounts.data.result.value.length; i++) {
      const account = res_accounts.data.result.value[i];

      const seed: Uint8Array = base58_decode(wallets[i].private);
      const from: Uint8Array = base58_decode(wallets[i].public);
      const to: Uint8Array = base58_decode(
        'GPMztJSu28d8fLGW6sVarXSGBxMToxA4n4GAdyA3qmiJ',
      );

      const fee: bigint = BigInt(Math.floor(5000 * 1.25)); // in lamports
      let amount: bigint = BigInt(account.lamports) - fee;

      if (amount <= fee) {
        continue;
      }

      const amount_uint8array2: Buffer = Buffer.alloc(8);
      amount_uint8array2.writeBigUInt64LE(amount);

      // LE (little endian)
      const amount_uint8array: Uint8Array = new Uint8Array(8);
      for (let i: number = 0; i < 8; i++) {
        const remainder: bigint = amount % 256n;
        amount = amount / 256n;
        amount_uint8array[i] = Number(remainder);
      }

      const data: Uint8Array = Buffer.concat([
        Buffer.from([2]), // Transfer instruction index
        amount_uint8array2,
      ]);

      const message: Uint8Array = Buffer.concat([
        // # version prefix, binary 10000000 — v0 marker
        Buffer.from([0x80]),

        // # header (3 bytes)
        Buffer.from([1, 0, 1]),

        // # account keys
        Buffer.from([3]), // 3 accounts
        Buffer.from(from),
        Buffer.from(to),
        Buffer.from(base58_decode('11111111111111111111111111111111')),

        // # blockhash
        Buffer.from(blockhash),

        // # instructions
        Buffer.from([1]), // 1 instruction
        Buffer.from([2]), // program id index (index in account list)
        Buffer.from([2]), // 2 accounts
        Buffer.from([0, 1]), // account indexes: from = 0, to = 1
        Buffer.from([data.length]), // data.length
        data,

        // # address table lookups
        Buffer.from([0]),
      ]);

      // 3. Sign the message
      const signature: Uint8Array = await ed25519.signAsync(message, seed);

      // 4. Build final transaction (signature + message)
      const transaction: Buffer = Buffer.concat([
        Buffer.from([1]), // 1 signature
        signature,
        message,
      ]);

      // IMPORTANT: message instruction buffer alignment doesn't work, we can't send a transaction to our main wallet to withdraw the order, TODO: find a solution without usind any 3rd party like @solana/web3.js

      // 5. Send transaction
      const res_transaction = await axios.post(blockchain.url_rpc, {
        jsonrpc: '2.0',
        id: 1,
        method: 'sendTransaction',
        params: [transaction.toString('base64'), { encoding: 'base64' }],
      });
    }

    if (wallets.length < limit) {
      wallets.length = 0; // to help garbage collection
      break;
    }

    skip += limit;
  }
}

export async function cron_wallet_scan_withdraw_ethereum(
  options: options_i,
): Promise<void> {}

export async function cron_wallet_scan_withdraw_bitcoin(
  options: options_i,
): Promise<void> {}

// refund the low balance to the client back
export async function cron_wallet_scan_refund_solana(
  options: options_i,
): Promise<void> {}

export async function cron_wallet_scan_refund_ethereum(
  options: options_i,
): Promise<void> {}

export async function cron_wallet_scan_refund_bitcoin(
  options: options_i,
): Promise<void> {}

export default {
  socket_wallet_connect_solana,
  socket_wallet_connect_ethereum,
  socket_wallet_connect_bitcoin,

  cron_wallet_scan_solana,
  cron_wallet_scan_ethereum,
  cron_wallet_scan_bitcoin,

  cron_wallet_scan_withdraw_solana,
  cron_wallet_scan_withdraw_ethereum,
  cron_wallet_scan_withdraw_bitcoin,

  cron_wallet_scan_refund_solana,
  cron_wallet_scan_refund_ethereum,
  cron_wallet_scan_refund_bitcoin,
};
