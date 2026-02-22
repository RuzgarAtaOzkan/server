'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { review_validator_init, review_create_doc } from '../utils/services';
import { random } from '../utils/common';

class service_review_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new review_validator_init(options);
  }

  async create(credentials: any): Promise<any> {
    await this.validator.create(credentials);

    const doc: any = review_create_doc(credentials);

    const insert_one_result: InsertOneResult =
      await this.options.db.reviews.insertOne(doc);

    doc._id = insert_one_result.insertedId;

    return doc;
  }

  async edit(credentials: any): Promise<any> {
    await this.validator.edit(credentials, this.options);

    const $or: any[] = [];
    const $set: any = { updated_at: new Date() };

    if (credentials._id) {
      $or.push({ _id: ObjectId.createFromHexString(credentials._id) });
    }

    if (credentials.product_id) {
      $or.push({
        product_id: ObjectId.createFromHexString(credentials.product_id),
      });
    }

    if (typeof credentials.rating === config.type_number) {
      $set.rating = credentials.rating;
    }

    if (typeof credentials.comment === config.type_string) {
      $set.comment = credentials.comment;
    }

    await this.options.db.reviews.updateOne({ $or: $or }, { $set: $set });

    return $set;
  }

  async get(credentials: any): Promise<Document | null> {
    await this.validator.get(credentials);

    const limit: number = 20;
    const skip: number = 0;

    const reviews: Document[] = await this.options.db.reviews
      .find({
        product_id: ObjectId.createFromHexString(credentials.product_id),
        comment: { $ne: '' },
      })
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    return reviews;
  }
}

export default service_review_init;
