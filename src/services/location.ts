'use strict';

// MODULES
import fs from 'fs';
import axios from 'axios';
import crypto from 'node:crypto';
import validator from 'validator';

// INTERFACES
import { Document, InsertOneResult, ObjectId, UpdateResult } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import {
  validator_location_init,
  location_validate_hash,
  create_location_doc,
} from '../utils/services';
import { random, sleep } from '../utils/common';

class service_location_init {
  private readonly options: any;
  private readonly validator: any;

  private readonly api_keys_0x: string[];
  private api_keys_0x_index: number;

  private readonly api_keys_moralis: string[];
  private api_keys_moralis_index: number;

  private readonly chain_ids: number[];

  constructor(options: any) {
    this.options = options;
    this.validator = new validator_location_init(options);

    this.chain_ids = [1, 56, 137]; // ETH, BNB, POL

    this.api_keys_0x = config.env.API_KEY_0X.split(' ');
    this.api_keys_0x_index = 0;

    this.api_keys_moralis = config.env.API_KEY_MORALIS.split(' ');
    this.api_keys_moralis_index = 0;
  }

  async get_locations(credentials: any): Promise<any> {
    await this.validator.get_locations(credentials);

    const locations: any = await this.options.db.locations
      .find({})
      .limit(credentials.limit)
      .toArray();

    return locations;
  }

  async create_location(credentials: any): Promise<any> {
    await this.validator.create_location(credentials);

    const base64_buffer: string[] = credentials.img_base64.split(';base64,');
    const base64_type: string = base64_buffer[0];
    const base64_data: string = base64_buffer[1];

    const file_ext: string = base64_type.split('/')[1];
    const file_name: string = random({ length: 32 }) + '.' + file_ext;

    // File system integration

    // Write new base64 buffer to file asynchronously
    fs.writeFileSync('public/images/' + file_name, base64_data, {
      encoding: 'base64',
    });

    credentials.img = 'https://' + config.env.URL_API + '/images/' + file_name;

    const doc: any = create_location_doc(credentials, this.options);

    const insert_one_result: InsertOneResult =
      await this.options.db.locations.insertOne(doc);

    return {
      ...doc,
      _id: insert_one_result.insertedId,
    };
  }

  async delete_location(credentials: any): Promise<any> {
    await this.validator.delete_location(credentials);

    const location: any = await this.options.db.locations.findOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });

    if (!location) {
      return null;
    }

    // delete img from public folder as well
    const location_img_parts: string[] = location.img.split('/');
    const location_img_id: string =
      location_img_parts[location_img_parts.length - 1];
    fs.unlink('public/images/' + location_img_id, function (err: any) {});

    await this.options.db.locations.deleteOne({
      _id: ObjectId.createFromHexString(credentials._id),
    });

    return true;
  }

  async get_available_locations(credentials: any): Promise<number> {
    const query: object = { hash: null };

    const locations_available: any = await this.options.db.locations
      .find(query)
      .toArray();

    return locations_available.length;
  }

  async get_location_prices(credentials: any): Promise<any> {
    await this.validator.get_location_prices(credentials);

    const prices: any = {};
    const settings: any = JSON.parse(await this.options.redis.get('settings'));

    for (let i: number = 0; i < this.chain_ids.length; i++) {
      const chain = config.blockchain_chains[this.chain_ids[i]];

      // open this section when moralis daily cpu usage is completed.

      /*
      this.api_keys_0x_index++;
      if (this.api_keys_0x_index >= this.api_keys_0x.length) {
        this.api_keys_0x_index = 0;
      }
      const api_key_0x: string = this.api_keys_0x[this.api_keys_0x_index];

      const sell_token: string = chain.usdc_address;
      const buy_token: string = chain.token_address;

      let sell_amount: string = '1';
      for (let i: number = 0; i < chain.usdc_decimals; i++) {
        sell_amount += '0';
      }

      const query_0x: string = `?sellToken=${sell_token}&buyToken=${buy_token}&sellAmount=${sell_amount}`;

      const url_0x: string =
        'https://' + chain['0x_param'] + 'api.0x.org/swap/v1/price' + query_0x;

      const res_price: any = await axios.get(url_0x, {
        headers: { '0x-api-key': api_key_0x },
      });

      let coin_price: number = Number(res_price.data.buyAmount);
      for (let i: number = 0; i < chain.token_decimals; i++) {
        coin_price = coin_price * 0.1;
      }
      coin_price = 1.0 / coin_price;

      prices[this.chain_ids[i]] = settings.location_price / coin_price;
      */

      const url_moralis: string =
        'https://deep-index.moralis.io/api/v2.2/erc20/' +
        chain.wrapped_address +
        '/price?chain=0x' +
        this.chain_ids[i].toString(16) +
        '&include=percent_change';

      this.api_keys_moralis_index++;
      if (this.api_keys_moralis_index >= this.api_keys_moralis.length) {
        this.api_keys_moralis_index = 0;
      }
      const api_key_moralis: string =
        this.api_keys_moralis[this.api_keys_moralis_index];

      const res_moralis: any = await axios.get(url_moralis, {
        headers: {
          accept: 'application/json',
          'x-api-key': api_key_moralis,
        },
      });

      prices[this.chain_ids[i]] =
        settings.location_price / res_moralis.data.usdPrice;
    }

    return prices;
  }

  async open_location(credentials: any): Promise<any> {
    await this.validator.open_location(credentials); // credentials.hash characters are lowered, spaces are removed

    const location_opened: any = await this.options.db.locations.findOne({
      hash: credentials.hash,
      // hash: { $regex: '^' + credentials.hash + '$', $options: 'i' }, // case-insensitive search
    });

    if (location_opened) {
      return location_opened;
    }

    if (
      credentials.hash.length < 32 ||
      !credentials.hash.startsWith('0x') ||
      !validator.isHexadecimal(credentials.hash)
    ) {
      const coupon: any = await this.options.db.coupons.findOne({
        code: credentials.hash.toUpperCase(),
        // code: { $regex: '^' + credentials.hash + '$', $options: 'i' },
      });

      if (!coupon) {
        return null;
      }

      const coupon_code: string = coupon.code.toLowerCase();

      const location: Document =
        await this.options.db.locations.findOneAndUpdate(
          { hash: null },
          { $set: { hash: coupon_code, updated_at: new Date() } },
          { returnOriginal: false, new: true }
        );

      if (location) {
        await this.options.db.coupons.deleteOne({ _id: coupon._id });
      }

      return location;
    }

    this.api_keys_moralis_index++;
    if (this.api_keys_moralis_index >= this.api_keys_moralis.length) {
      this.api_keys_moralis_index = 0;
    }
    const api_key_moralis: string =
      this.api_keys_moralis[this.api_keys_moralis_index];

    const is_hash_valid: any = await location_validate_hash(
      credentials.hash,
      this.chain_ids,
      api_key_moralis,
      this.options
    );

    if (!is_hash_valid) {
      return null;
    }

    const location: Document = await this.options.db.locations.findOneAndUpdate(
      { hash: null },
      { $set: { hash: credentials.hash, updated_at: new Date() } },
      { returnOriginal: false, new: true }
    );

    return location;
  }
}

export default service_location_init;
