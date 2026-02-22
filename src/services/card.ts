'use strict';

// MODULES
import fs from 'node:fs';
import axios from 'axios';
import crypto from 'node:crypto';

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
import { card_create_doc, card_validator_init } from '../utils/services';

class service_order_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new card_validator_init(options);
  }

  async get_card(credentials: any): Promise<Document | null> {
    const card: Document | null = await this.options.db.cards.findOne({
      user_id: credentials.user._id,
    });

    return card;
  }

  async create_card(credentials: any): Promise<Document> {
    await this.validator.create_card(credentials);

    const doc: any = card_create_doc(credentials);
    const result: InsertOneResult = await this.options.db.cards.insertOne(doc);

    doc._id = result.insertedId;

    return doc;
  }

  async edit_card(credentials: any): Promise<UpdateResult> {
    await this.validator.edit_card(credentials);

    const $set: any = {
      updated_at: new Date(),
    };

    if (credentials.number) {
      $set.number = credentials.number;
    }

    if (credentials.month) {
      $set.month = credentials.month;
    }

    if (credentials.year) {
      $set.year = credentials.year;
    }

    if (credentials.cvc) {
      $set.cvc = credentials.cvc;
    }

    const result: UpdateResult = await this.options.db.cards.updateOne(
      { user_id: credentials.user._id },
      { $set: $set }
    );

    return result;
  }

  async delete_card(credentials: any): Promise<DeleteResult> {
    await this.validator.delete_card(credentials);

    const result: DeleteResult = await this.options.db.cards.deleteOne({
      user_id: credentials.user._id,
    });

    return result;
  }
}

export default service_order_init;
