'use strict';

// INTERFACES
import { Document, ObjectId } from 'mongodb';
import { options_i } from 'interfaces/common';

// UTILS
import { product_validator_init } from '../utils/services';

class service_product_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new product_validator_init(options);
  }

  async get_products(credentials: any): Promise<Document[]> {
    await this.validator.get_products(credentials);

    const limit: number = 20;
    const skip: number = Number(credentials.skip) || 0;

    // belongs to the specified store,
    const query: any = {};

    if (credentials.name) {
      query.name = credentials.name;
    }

    if (credentials.category) {
      query.category = credentials.category;
    }

    const products: Document[] = await this.options.db.products
      .find(query)
      .limit(limit)
      .skip(skip * limit)
      .toArray();

    const reviews_promises: Promise<Document>[] = [];
    for (let i: number = 0; i < products.length; i++) {
      products[i].img = JSON.parse(products[i].img);
      reviews_promises.push(
        this.options.db.reviews.find({ product_id: products[i]._id }).toArray()
      );
    }

    const res_reviews_promises = await Promise.all(reviews_promises);

    for (let i: number = 0; i < products.length; i++) {
      let rating: number = 0;

      for (let j: number = 0; j < res_reviews_promises[i].length; j++) {
        rating = rating + res_reviews_promises[i][j].rating;
      }

      rating = rating / res_reviews_promises[i].length;

      products[i].rating = rating || 0;
      products[i].rating_count = res_reviews_promises[i].length;
    }

    return products;
  }

  async get_product(credentials: any): Promise<Document | null> {
    await this.validator.get_product(credentials);

    // TODO: move rating calculation to cron job to avoid calculations on every request

    const res = await Promise.all([
      this.options.db.products.findOne({
        _id: ObjectId.createFromHexString(credentials._id),
        quantity: { $gte: 1 },
      }),
      this.options.db.reviews
        .find({
          product_id: ObjectId.createFromHexString(credentials._id),
        })
        .toArray(),
    ]);

    const product: Document | null = res[0];
    const reviews: Document[] = res[1];

    if (product === null) {
      return null;
    }

    let rating: number = 0;
    for (let i: number = 0; i < reviews.length; i++) {
      rating = rating + reviews[i].rating;
    }
    rating = rating / reviews.length;

    product.img = JSON.parse(product.img);
    product.rating = rating || 0;
    product.rating_count = reviews.length;

    return product;
  }
}

export default service_product_init;
