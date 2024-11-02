'use strict';

// MODULES
import crypto from 'node:crypto';

// CONFIG
import config from '../config';

export async function sleep(ms: number = 1000): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

export function str_remove_space(str: string): string {
  let result: string = '';

  for (let i: number = 0; i < str.length; i++) {
    // "  "
    // if current character is empty and the next character is empty or null, remove it
    if (str[i] === ' ' && (!str[i + 1] || str[i + 1] === ' ')) {
      continue;
    }

    // scenario for strings who starts with empty chars,
    if (result === '' && str[i] === ' ' && str[i + 1] !== ' ') {
      continue;
    }

    result = result + str[i];
  }

  return result;
}

export function random({ length = 32, type = 'hex' }): string {
  switch (type) {
    case 'hex':
      return crypto.randomBytes(length / 2).toString('hex');

    case 'distinguishable':
      return crypto
        .randomBytes(length / 2)
        .toString('hex')
        .toUpperCase();

    case 'url-safe':
      return crypto.randomBytes(length).toString('base64url');

    default:
      return crypto.randomBytes(length / 2).toString('hex');
  }
}

export function add_commas(value: number) {
  const number: string = value.toString().split('.')[0];
  const decimals: string = value.toString().split('.')[1];

  let result: string = '';

  for (let i: number = number.length - 1; i > -1; i--) {
    result = number[i] + result;

    if (result.replace(/,/g, '').length % 3 === 0) {
      result = ',' + result;
    }
  }

  if (result[0] === ',') {
    result = result.replace(',', '');
  }

  if (decimals) {
    return result + '.' + decimals;
  }

  return result;
}

export default {
  sleep,
  str_remove_space,
  random,
  add_commas,
};
