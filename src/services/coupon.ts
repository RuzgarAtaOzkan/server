'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';
import axios from 'axios';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import { coupon_create_doc, coupon_validator_init } from '../utils/services';
import { options_i } from 'interfaces/common';
import UTILS_COMMON from '../utils/common';

class service_coupon_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new coupon_validator_init(options);
  }

  async get_coupon(credentials: any): Promise<Document | null> {
    await this.validator.get_coupon(credentials);

    const coupon: Document | null = await this.options.db.coupons.findOne({
      code: credentials.code,
      quantity: { $gte: 1 },
    });

    if (coupon === null) {
      return null;
    }

    coupon.code = coupon.code.toUpperCase();

    return coupon;
  }
}

export default service_coupon_init;
