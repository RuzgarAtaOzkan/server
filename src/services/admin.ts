'use strict';

// MODULES
import fs from 'node:fs';
import crypto from 'node:crypto';

// INTERFACES
import {
  Document,
  UpdateResult,
  DeleteResult,
  InsertOneResult,
  ObjectId,
} from 'mongodb';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import {
  admin_validator_init,
  product_create_doc,
  coupon_create_doc,
} from '../utils/services';
import { random } from '../utils/common';

class service_admin_init {
  private readonly options: options_i;
  private readonly validator: any;

  constructor(options: options_i) {
    this.options = options;
    this.validator = new admin_validator_init(options);
  }

  async mail_send(credentials: any): Promise<any> {}

  async settings_edit(credentials: any): Promise<void> {
    await this.validator.settings_edit(credentials);

    const settings: any | null = JSON.parse(
      await this.options.redis.get('settings')
    );

    await this.options.redis.set('settings', JSON.stringify(settings));

    return settings;
  }

  async products_create(credentials: any): Promise<Document> {
    await this.validator.products_create(credentials);

    const img: string[] = [];
    for (let i: number = 0; i < credentials.img.length; i++) {
      const base64_buffer: string[] = credentials.img[i].split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = random() + '.' + file_ext;

      // write new base64 buffer to file synchronously
      fs.writeFileSync('public/images/' + file_name, base64_data, {
        encoding: 'base64',
      });

      const url: string = config.ENV_URL_API + '/images/' + file_name;

      img.push(url);
    }

    credentials.img = img;

    const doc: Document = product_create_doc(credentials);
    const result: InsertOneResult = await this.options.db.products.insertOne(
      doc
    );

    doc._id = result.insertedId;

    return doc;
  }

  async products_edit(credentials: any): Promise<any> {
    const product: Document = await this.validator.products_edit(credentials);

    const $set: any = {
      updated_at: new Date(),
    };

    // adding a new img url to the img array
    if (typeof credentials.img === config.type_string) {
      const base64_buffer: string[] = credentials.img.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string = random() + '.' + file_ext;

      // write new base64 buffer to file synchronously
      fs.writeFileSync('public/images/' + file_name, base64_data, {
        encoding: 'base64',
      });

      const url: string = config.ENV_URL_API + '/images/' + file_name;
      const img: string[] = JSON.parse(product.img);

      img.push(url);

      $set.img = JSON.stringify(img);
    }

    // deleting an image from the img array (also deleting from the files)
    if (typeof credentials.img === config.type_number) {
      const index: number = credentials.img;

      const img: string[] = JSON.parse(product.img); // image array

      const img_parts: string[] = img[index].split('/');
      const img_id: string = img_parts[img_parts.length - 1];

      fs.unlink('public/images/' + img_id, function (err: any) {});

      for (let i: number = index; i < img.length; i++) {
        img[i] = img[i + 1];
      }

      img.length = img.length - 1;

      $set.img = JSON.stringify(img);
    }

    if (credentials.name) {
      $set.name = credentials.name;
    }

    if (credentials.description) {
      $set.description = credentials.description;
    }

    if (credentials.category) {
      $set.category = credentials.category;
    }

    if (credentials.price) {
      $set.price = credentials.price;
    }

    if (credentials.quantity) {
      $set.quantity = credentials.quantity;
    }

    const result: UpdateResult = await this.options.db.products.updateOne(
      { _id: ObjectId.createFromHexString(credentials._id) },
      { $set: $set }
    );

    return result;
  }

  async products_delete(credentials: any): Promise<any> {
    const product: Document = await this.validator.products_delete(credentials);

    const img: string[] = JSON.parse(product.img);
    for (let i: number = 0; i < img.length; i++) {
      // Delete image of the product first
      const img_parts: string[] = img[i].split('/');
      const img_id: string = img_parts[img_parts.length - 1];
      fs.unlink('public/images/' + img_id, function (err: any) {});
    }

    // IMPORTANT: (vulnerable to race conditions: delete_product & create_order at the same time)
    const result: DeleteResult = await this.options.db.products.deleteOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });
    // IMPORTANT END

    // also delete product's reviews
    await this.options.db.review.deleteMany({
      product_id: ObjectId.createFromHexString(credentials._id),
    });

    return result;
  }

  async wallets_get(credentials: any): Promise<Document[]> {
    await this.validator.wallets_get(credentials);

    const query: any = {};

    const limit: number = 20;
    const skip: number = Number(credentials.skip) || 0;

    if (credentials.status) {
      query.status = Number(credentials.status);
    }

    const wallets: Document[] = await this.options.db.wallets
      .find(query)
      .limit(limit)
      .skip(skip)
      .toArray();

    return wallets;
  }

  async coupons_get(credentials: any): Promise<Document[]> {
    const limit: number = 20;
    const skip: number = Number(credentials.page) || 0;

    const coupons: Document[] = await this.options.db.coupons
      .find({})
      .limit(limit)
      .skip(skip)
      .toArray();

    return coupons;
  }

  async coupons_create(credentials: any): Promise<Document> {
    await this.validator.coupons_create(credentials);

    const doc: any = await coupon_create_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.coupons.insertOne(doc);

    doc._id = insert_one_result.insertedId;
    doc.code = doc.code.toUpperCase();

    return doc;
  }
}

export default service_admin_init;
