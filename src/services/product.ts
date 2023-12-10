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

class service_product_init {
  private options: options_i;
  private imagekit: any;
  private validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new UTILS_SERVICES.validator_product_init(options);
    this.imagekit = new ImageKit({
      publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
    });
  }

  async get_product(credentials: any): Promise<any> {
    await this.validator.get_product(credentials);
  }

  async get_products(credentials: any): Promise<any> {
    // delete undefined query values from credentials, we need valid keys count to check full && match
    await this.validator.get_products(credentials);

    const query = credentials.query;

    // credentials { name: 'T-Shirt', fav}
    let query_count: number = 0;
    for (const key in query) {
      if (query[key]) {
        query_count++;
      }
    }

    const results: any[] = [];
    const products = await this.options.redis.hGetAll('products');

    for (const key in products) {
      /* SEARCH QUERY AREA */
      let query_ctr: number = 0;
      const product = JSON.parse(products[key]);

      if (product.store_id === query.store_id) {
        query_ctr++;
      }

      if (product.name.toLowerCase().includes(query.name?.toLowerCase())) {
        query_ctr++;
      }

      if (product.featured && query.featured === '1') {
        query_ctr++;
      }

      if (product.category === query.category) {
        query_ctr++;
      }

      if (product.sex === query.sex) {
        query_ctr++;
      }

      if (product.price < query.price_under) {
        query_ctr++;
      }

      if (product.price > query.price_over) {
        query_ctr++;
      }

      // add current product to response if matched all queries not more
      if (query_ctr === query_count) {
        results.push(product);
      }
    }

    return results;
  }

  async get_fav_products(credentials: any): Promise<any> {
    const products: string[] = await this.options.redis.hmGet(
      'products',
      credentials.user.favs.split(' ')
    );

    for (let i: number = 0; i < products.length; i++) {
      products[i] = JSON.parse(products[i]);
    }

    return products;
  }

  async edit_fav_products(credentials: any): Promise<any> {
    await this.validator.edit_fav_products(credentials);

    await this.options.db.users.updateOne(
      { _id: credentials.user._id },
      {
        $set: {
          favs: credentials.favs
            .map((curr: any, index: number) => {
              return curr.id;
            })
            .join(' '),
        },
      }
    );

    return credentials.favs;
  }

  async create_product(credentials: any): Promise<void> {
    const store = await this.validator.create_product(credentials);
    const id: string = await UTILS_SERVICES.generate_product_id(
      6,
      this.options
    );

    // discount percentage ratio
    const price_discount_percentage: number =
      (1 - credentials.price_discount / credentials.price) * 100;

    const product: any = {
      id: id,
      store_id: credentials.store_id.toString(),
      store_name: store.name,
      owner_id: credentials.user._id.toString(),
      name: credentials.name,
      desc: credentials.desc,
      featured: credentials.featured,
      category: credentials.category,
      sex: credentials.sex,
      price: credentials.price,
      price_discount: credentials.price_discount,
      price_discount_percentage: price_discount_percentage,
      img: credentials.img_url,
      src: credentials.src,
      updated_at: new Date(),
      created_at: new Date(),
    };

    await this.options.redis.hSet(
      'products',
      product.id,
      JSON.stringify(product)
    );

    return product;
  }

  async edit_product(credentials: any): Promise<any> {
    const { product, store } = await this.validator.edit_product(credentials);

    // discount percentage calculations
    const price_discount_percentage: number =
      (1 - credentials.price_discount / credentials.price) * 100;

    const product_updated: any = {
      id: credentials.id,
      store_id: credentials.store_id.toString(),
      store_name: store.name,
      owner_id: credentials.owner_id,
      name: credentials.name,
      desc: credentials.desc,
      featured: credentials.featured,
      category: credentials.category,
      sex: credentials.sex,
      price: credentials.price,
      price_discount: credentials.price_discount,
      price_discount_percentage: price_discount_percentage,
      img: credentials.img_url,
      src: credentials.src,
      updated_at: new Date(),
      created_at: product.created_at,
    };

    await this.options.redis.hSet(
      'products',
      product_updated.id,
      JSON.stringify(product_updated)
    );

    return product_updated;
  }

  async delete_product(credentials: any): Promise<any> {
    const product = await this.validator.delete_product(credentials);
    await this.options.redis.hDel('products', credentials.id);
    return true;
  }
}

export default service_product_init;
