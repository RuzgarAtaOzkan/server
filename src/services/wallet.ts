'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';

// INTERFACES
import {
  DeleteResult,
  Document,
  InsertOneResult,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { wallet_validator_init, wallet_create_doc } from '../utils/services';
import { random } from '../utils/common';

class service_wallet_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new wallet_validator_init(options);
  }

  async get_wallet(credentials: any): Promise<Document> {
    const wallet: Document = await this.validator.get_wallet(credentials);

    this.options.db.wallets.updateOne(
      { _id: wallet._id },
      { $set: { updated_at: new Date() } }
    );

    // IMPORTANT: do not expose the private key to client
    delete wallet.private;

    return wallet;
  }

  async create_wallet(credentials: any): Promise<Document> {
    await this.validator.create_wallet(credentials);

    const doc: Document = await wallet_create_doc(credentials, this.options);
    const result: InsertOneResult = await this.options.db.wallets.insertOne(
      doc
    );
    doc._id = result.insertedId;

    const blockchain_id_solana: string = 'solana';
    const blockchain_id_ethereum: string = 'ethereum';
    const blockchain_id_bitcoin: string = 'bitcoin';

    if (credentials.blockchain === blockchain_id_solana) {
      let socket: WebSocket | any = null;
      for (let i: number = 0; i < this.options.sockets.length; i++) {
        if (this.options.sockets[i].blockchain === blockchain_id_solana) {
          socket = this.options.sockets[i];
          break;
        }
      }

      socket.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: result.insertedId.toString(), // IMPORTANT: so we can grab the wallet._id coming to socket message event listener notification so we can place subscription id to that document with updateOne, only way to track which wallet document our public account subscription id is going to be placed in
          method: 'accountSubscribe',
          params: [
            doc.public,
            { encoding: 'jsonParsed', commitment: 'finalized' },
          ],
        })
      );
    }

    if (credentials.blockchain === blockchain_id_ethereum) {
    }

    if (credentials.blockchain === blockchain_id_bitcoin) {
    }

    // IMPORTANT: do not expose the private key to client
    delete doc.private;

    return doc;
  }
}

export default service_wallet_init;
