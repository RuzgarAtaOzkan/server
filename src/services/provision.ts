'use strict';

// INTERFACES
import { Document, InsertOneResult, ObjectId, UpdateResult } from 'mongodb';
import { options_i } from 'interfaces/common';

// UTILS
import {
  provision_validator_init,
  provision_create_doc,
  order_create_doc,
} from '../utils/services';

class service_provision_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new provision_validator_init(options);
  }

  async get_provision(credentials: any): Promise<Document | null> {
    await this.validator.get_provision(credentials);

    const provision: Document | null = await this.options.db.provisions.findOne(
      { _id: ObjectId.createFromHexString(credentials._id) }
    );

    return provision;
  }

  async create_provision(credentials: any): Promise<Document> {
    await this.validator.create_provision(credentials);

    let price: number = 0; // total price of basket
    for (let i: number = 0; i < credentials.basket.length; i++) {
      price += credentials.basket[i].price;
    }

    // send total price to Garanti BBVA's sanal pos page generationo api

    const doc: Document = provision_create_doc(credentials);
    const result: InsertOneResult = await this.options.db.provisions.insertOne(
      doc
    );
    doc._id = result.insertedId;

    // const url_garanti: string = 'https://sanalposprovtest.garantibbva.com.tr/servlet/gt3dengine';

    return doc;
  }

  async create_order(credentials: any): Promise<Document | null> {
    const provision: Document = await this.validator.create_order(credentials);

    // we already parsed the basket in validator
    // provision.basket = JSON.parse(provision.basket);

    for (let i: number = 0; i < provision.basket.length; i++) {
      const product_update: UpdateResult =
        await this.options.db.products.updateOne(
          {
            _id: ObjectId.createFromHexString(provision.basket[i]._id),
            quantity: { $gte: provision.basket[i].quantity },
          },
          { $inc: { quantity: -provision.basket[i].quantity } }
        );

      if (product_update.modifiedCount === 0) {
        for (let j: number = 0; j < i; j++) {
          this.options.db.products.updateOne(
            {
              _id: ObjectId.createFromHexString(provision.basket[j]._id),
            },
            { $inc: { quantity: provision.basket[j].quantity } }
          );
        }

        // TODO: refund process, inform user there was an error updating the product stocks

        return null;
      }
    }

    const order: Document = order_create_doc(provision);
    //order._id = provision._id;

    const order_insert: InsertOneResult =
      await this.options.db.orders.insertOne(order);

    order._id = order_insert.insertedId;

    this.options.db.provisions.deleteOne({ _id: provision._id });

    // TODO: inform user that their order has been placed by email

    return order;
  }
}

export default service_provision_init;
