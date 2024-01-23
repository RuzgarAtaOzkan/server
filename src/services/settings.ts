'use strict';

// MODULES
import fs from 'fs';
import crypto from 'node:crypto';
import validator from 'validator';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';
import UTILS_COMMON from '../utils/common';

class service_settings_init {
  private options: any;
  private validator: any;

  constructor(options: any) {
    this.options = options;

    this.validator = new UTILS_SERVICES.validator_settings_init(options);
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

    const settings = JSON.parse(await this.options.redis.get('settings'));

    for (let i: number = 0; i < settings.banners.length; i++) {
      // Delete previous store img file
      const previous_img_parts: string[] = settings.banners[i].img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];

      fs.unlink('public/images/' + previous_img_id, function (err: any) {});
    }

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

        // Write new base64 buffer to file asyncronously
        fs.writeFile(
          'public/images/' + file_name,
          base64_data,
          { encoding: 'base64' },
          function (err: any) {}
        );

        const image_url: string =
          'https://' + config.env.URL_API + '/public/images/' + file_name;

        credentials.banners[i].img = image_url;
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

    const settings = JSON.parse(await this.options.redis.get('settings'));

    // delete previous campaign image files
    for (let i: number = 0; i < settings.campaigns.length; i++) {
      // Delete previous store img file
      const previous_img_parts: string[] = settings.campaigns[i].img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];

      fs.unlink('public/images/' + previous_img_id, function (err: any) {});
    }

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

        // Write new base64 buffer to file asyncronously
        fs.writeFile(
          'public/images/' + file_name,
          base64_data,
          { encoding: 'base64' },
          function (err: any) {}
        );

        const image_url: string =
          'https://' + config.env.URL_API + '/public/images/' + file_name;

        credentials.campaigns[i].img = image_url;
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

    const settings = JSON.parse(await this.options.redis.get('settings'));

    // delete previous notifications image files
    for (let i: number = 0; i < settings.notifications.length; i++) {
      // Delete previous store img file
      const previous_img_parts: string[] =
        settings.notifications[i].img.split('/');
      const previous_img_id: string =
        previous_img_parts[previous_img_parts.length - 1];

      fs.unlink('public/images/' + previous_img_id, function (err: any) {});
    }

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

        // Write new base64 buffer to file asyncronously
        fs.writeFile(
          'public/images/' + file_name,
          base64_data,
          { encoding: 'base64' },
          function (err: any) {}
        );

        const image_url: string =
          'https://' + config.env.URL_API + '/public/images/' + file_name;

        credentials.notifications[i].img = image_url;
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

    settings.notifications = credentials.notifications;

    await this.options.redis.set('settings', JSON.stringify(settings));

    return settings.notifications;
  }
}

export default service_settings_init;
