'use strict';

// MODULES
import crypto from 'node:crypto';

// CONFIG
import config from '../config';

export function str_remove_space(str: string, type?: string): string {
  if (!str) {
    return '';
  }

  let str_final: string = '';

  if (type === 'all') {
    for (let i: number = 0; i < str.length; i++) {
      if (str[i] === ' ') {
        continue;
      }

      str_final += str[i];
    }

    return str_final;
  }

  for (let i: number = 0; i < str.length; i++) {
    if (str[i] === ' ' && (str[i + 1] === ' ' || !str[i + 1])) {
      continue;
    }

    if (str_final === '' && str[i] === ' ' && str[i + 1] !== ' ') {
      continue;
    }

    str_final = str_final + str[i];
  }

  return str_final;
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

export default {
  str_remove_space,
  random,
};
