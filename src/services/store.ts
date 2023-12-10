'use strict';

// MODULES
import nodemailer from 'nodemailer';
import ImageKit from 'imagekit';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';
import options_i from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';
import UTILS_COMMON from '../utils/common';

class service_store_init {
  private options: options_i;
  private imagekit: any;
  private validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new UTILS_SERVICES.validator_store_init(options);
    this.imagekit = new ImageKit({
      publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
    });
  }

  async get_store(credentials: any): Promise<any> {
    await this.validator.get_store(credentials);

    const stores: Document[] = await this.options.db.stores
      .find({ name: { $regex: '^' + credentials.name + '$', $options: 'i' } })
      .limit(credentials.limit)
      .toArray();

    return stores;
  }

  async get_stores(credentials: any): Promise<any> {
    await this.validator.get_stores(credentials);

    const stores: Document[] = await this.options.db.stores
      .find({})
      .skip(credentials.page * 20)
      .limit(credentials.limit)
      .toArray();

    return stores;
  }

  async create_store(credentials: any): Promise<void> {
    await this.validator.create_store(credentials);

    const base64_buffer: string[] = credentials.img_base64.split(';base64,');
    const base64_type: string = base64_buffer[0];
    const base64_data: string = base64_buffer[1];

    const file_ext: string = base64_type.split('/')[1];
    const file_name: string =
      UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

    const imagekit_res: UploadResponse = await this.imagekit.upload({
      file: base64_data,
      fileName: file_name,
    });

    const store_doc: any = await UTILS_SERVICES.create_store_doc(
      credentials,
      this.options
    );

    store_doc.img = imagekit_res.url;

    const insert_one_result: InsertOneResult =
      await this.options.db.stores.insertOne(store_doc);

    return {
      ...store_doc,
      _id: insert_one_result.insertedId,
    };
  }

  async edit_store(credentials: any): Promise<any> {
    const store = await this.validator.edit_store(credentials);

    let imagekit_url: null | string = null;
    if (credentials.img_base64) {
      const base64_buffer: string[] = credentials.img_base64.split(';base64,');
      const base64_type: string = base64_buffer[0];
      const base64_data: string = base64_buffer[1];

      const file_ext: string = base64_type.split('/')[1];
      const file_name: string =
        UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

      const imagekit_res: UploadResponse = await this.imagekit.upload({
        file: base64_data,
        fileName: file_name,
      });

      imagekit_url = imagekit_res.url;
    }

    await this.options.db.stores.updateOne(
      { _id: new ObjectId(credentials._id) },
      {
        $set: {
          name: credentials.name,
          featured: credentials.featured,
          img: imagekit_url ? imagekit_url : store.img,
          updated_at: new Date(),
        },
      }
    );

    store.name = credentials.name;
    store.featured = credentials.featured;
    store.img = imagekit_url ? imagekit_url : store.img;
    store.updated_at = new Date();

    return store;
  }

  async delete_store(credentials: any): Promise<any> {
    const store = await this.validator.delete_store(credentials);

    await this.options.db.stores.deleteOne({
      _id: new ObjectId(credentials._id),
    });

    // delete all products owned by the current store
    const products = await this.options.redis.hGetAll('products');
    for (const key in products) {
      const product = JSON.parse(products[key]);

      if (product.store_id === credentials._id) {
        await this.options.redis.hDel('products', key);
      }
    }

    return true;
  }
}

export default service_store_init;
