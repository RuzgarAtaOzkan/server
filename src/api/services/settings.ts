'use strict';

// MODULES
import crypto from 'node:crypto';
import ImageKit from 'imagekit';
import validator from 'validator';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';
import { UploadResponse } from 'imagekit/dist/libs/interfaces';

// CONFIG
import config from '../../config';

// UTILS
import UTILS_SERVICES from '../../utils/services';
import UTILS_COMMON from '../../utils/common';

class service_settings_init {
  private options: any;
  private validator: any;
  private imagekit: ImageKit;

  constructor(options: any) {
    this.options = options;

    this.validator = new UTILS_SERVICES.validator_settings_init(options);

    this.imagekit = new ImageKit({
      publicKey: config.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: config.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: `https://ik.imagekit.io/${config.env.IMAGEKIT_ID}/`,
    });
  }

  async get_settings(credentials: any): Promise<any | null> {
    const settings: string = await this.options.redis.get('settings');
    const result = JSON.parse(settings);
    return result;
  }

  async edit_settings(credentials: any): Promise<any> {}

  async get_banners(credentials: any): Promise<any | null> {
    const settings: string = await this.options.redis.get('settings');
    const result = JSON.parse(settings);
    return result.banners;
  }

  async edit_banners(credentials: any): Promise<any> {
    await this.validator.edit_banners(credentials);

    for (let i = 0; i < credentials.banners.length; i++) {
      // new image process
      if (credentials.banners[i].img_base64) {
        const base64_buffer: string[] =
          credentials.banners[i].img_base64.split(';base64,');
        const base64_type: string = base64_buffer[0];
        const base64_data: string = base64_buffer[1];

        const file_ext: string = base64_type.split('/')[1];
        const file_name: string =
          UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

        const imagekit_upload_res: UploadResponse = await this.imagekit.upload({
          file: base64_data,
          fileName: file_name,
        });

        credentials.banners[i].img = imagekit_upload_res.url;
      }
    }

    credentials.banners = credentials.banners.map(
      (curr: any, index: number) => {
        return {
          img: curr.img,
          src: curr.src,
        };
      }
    );

    const settings = JSON.parse(await this.options.redis.get('settings'));

    settings.banners = credentials.banners;

    await this.options.redis.set('settings', JSON.stringify(settings));

    return settings.banners;
  }

  async get_campaigns(credentials: any): Promise<any | null> {
    const settings: string = await this.options.redis.get('settings');
    const result = JSON.parse(settings);
    return result.campaigns;
  }

  async edit_campaigns(credentials: any): Promise<any> {
    await this.validator.edit_campaigns(credentials);

    for (let i = 0; i < credentials.campaigns.length; i++) {
      // new image process
      if (credentials.campaigns[i].img_base64) {
        const base64_buffer: string[] =
          credentials.campaigns[i].img_base64.split(';base64,');
        const base64_type: string = base64_buffer[0];
        const base64_data: string = base64_buffer[1];

        const file_ext: string = base64_type.split('/')[1];
        const file_name: string =
          UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

        const imagekit_upload_res: UploadResponse = await this.imagekit.upload({
          file: base64_data,
          fileName: file_name,
        });

        credentials.campaigns[i].img = imagekit_upload_res.url;
      }
    }

    credentials.campaigns = credentials.campaigns.map(
      (curr: any, index: number) => {
        return {
          img: curr.img,
          src: curr.src,
          message: curr.message,
        };
      }
    );

    const settings = JSON.parse(await this.options.redis.get('settings'));

    settings.campaigns = credentials.campaigns;

    await this.options.redis.set('settings', JSON.stringify(settings));

    return settings.campaigns;
  }

  async get_notifications(credentials: any): Promise<any | null> {
    const settings: string = await this.options.redis.get('settings');
    const result = JSON.parse(settings);
    return result.notifications;
  }

  async edit_notifications(credentials: any): Promise<any | null> {
    await this.validator.edit_notifications(credentials);

    for (let i: number = 0; i < credentials.notifications.length; i++) {
      // new image process
      if (credentials.notifications[i].img_base64) {
        const base64_buffer: string[] =
          credentials.notifications[i].img_base64.split(';base64,');
        const base64_type: string = base64_buffer[0];
        const base64_data: string = base64_buffer[1];

        const file_ext: string = base64_type.split('/')[1];
        const file_name: string =
          UTILS_COMMON.random({ length: 32 }) + '.' + file_ext;

        const imagekit_upload_res: UploadResponse = await this.imagekit.upload({
          file: base64_data,
          fileName: file_name,
        });

        credentials.notifications[i].img = imagekit_upload_res.url;
      }
    }

    credentials.notifications = credentials.notifications.map(
      (curr: any, index: number) => {
        return {
          img: curr.img,
          src: curr.src,
          message: curr.message,
        };
      }
    );

    const settings = JSON.parse(await this.options.redis.get('settings'));

    settings.notifications = credentials.notifications;

    await this.options.redis.set('settings', JSON.stringify(settings));

    return settings.notifications;
  }
}

export default service_settings_init;
