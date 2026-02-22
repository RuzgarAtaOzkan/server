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
import {
  order_create_doc,
  order_generate_delivery_code,
  order_validator_init,
} from '../utils/services';
import { random } from '../utils/common';

class service_order_init {
  private readonly options: options_i;
  private readonly validator: any;

  private queue: any[];
  private queue_on: boolean;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new order_validator_init(options);

    this.queue = [];
    this.queue_on = false;
  }

  async queue_add(promise: Function, ...args: any[]): Promise<void> {
    this.queue.push(promise);

    // request b (doesn't processed)
    if (this.queue_on) {
      return;
    }

    this.queue_on = true;

    while (this.queue.length) {
      await this.queue[0](...args);
      this.queue.shift();
    }

    // request a

    this.queue_on = false;
  }

  async get_orders(credentials: any): Promise<Document[]> {
    await this.validator.get_orders(credentials);

    const limit: number = 20;
    const skip: number = Number(credentials.skip) || 0;

    const query: any = { user_id: credentials.user._id };

    const orders: Document[] = await this.options.db.orders
      .find(query)
      .sort({ _id: -1 })
      .limit(limit)
      .skip(skip * limit)
      .toArray();

    // orders with error messages can be viewed once by the user, we then delete them

    for (let i: number = 0; i < orders.length; i++) {
      orders[i].basket = JSON.parse(orders[i].basket);

      const products_promises: Promise<Document>[] = [];
      for (let j: number = 0; j < orders[i].basket.length; j++) {
        products_promises.push(
          this.options.db.products.findOne({
            _id: ObjectId.createFromHexString(orders[i].basket[j]._id),
          })
        );
      }

      const products: Document[] = await Promise.all(products_promises);

      for (let j: number = 0; j < orders[i].basket.length; j++) {
        Object.assign(orders[i].basket[j], products[j]);
      }
    }

    return orders;
  }

  async deliver_orders(credentials: any): Promise<Document> {
    const order: Document = await this.validator.deliver_orders(credentials);

    const update_order_result: UpdateResult =
      await this.options.db.orders.updateOne(
        { delivery_code: credentials.code },
        {
          $set: { status: 3, updated_at: new Date() },
          $unset: { delivery_code: 1 },
        }
      );

    return order;
  }
}

export default service_order_init;
