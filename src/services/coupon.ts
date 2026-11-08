'use strict';

// INTERFACES
import { Document } from 'mongodb';
import { options_i } from 'interfaces/common';

// UTILS/SERVICES
import { coupon_validator_init } from '../utils/services';

class service_coupon_init {
  private readonly options: options_i;
  private readonly validator: coupon_validator_init;

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
