'use strict';

// MODULES
import fs from 'fs';
import axios from 'axios';
import crypto from 'node:crypto';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import { create_coupon_doc, validator_coupon_init } from '../utils/services';
import UTILS_COMMON from '../utils/common';

class service_coupon_init {
  private readonly options: any;
  private readonly validator: any;

  constructor(options: any) {
    this.options = options;

    this.validator = new validator_coupon_init(options);
  }

  async get_coupons(credentials: any): Promise<any> {
    await this.validator.get_locations(credentials);

    const coupons: any = await this.options.db.coupons.find({}).toArray();

    return coupons;
  }

  async create_coupon(credentials: any): Promise<any> {
    await this.validator.create_coupon(credentials);

    const doc: any = await create_coupon_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.coupons.insertOne(doc);

    return {
      ...doc,
      _id: insert_one_result.insertedId,
    };
  }
}

export default service_coupon_init;
