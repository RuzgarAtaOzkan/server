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
  private readonly options: any;
  private readonly validator: any;

  constructor(options: any) {
    this.options = options;
    this.validator = new UTILS_SERVICES.validator_settings_init(options);
  }

  async get_settings(credentials: any): Promise<any | null> {
    const settings: string = await this.options.redis.get('settings');
    const result = JSON.parse(settings);
    return result;
  }
}

export default service_settings_init;
