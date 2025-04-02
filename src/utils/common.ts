'use strict';

// MODULES
import crypto from 'node:crypto';

export function sleep(ms: number = 1000): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    setTimeout(resolve, ms);
  });
}

export function str_remove_space(source: string): string {
  let result: string = '';

  for (let i: number = 0; i < source.length; i++) {
    // "  test  1  " => "test 1"
    // if current character is empty and the next character is empty or undefined, remove it
    if (
      source[i] === ' ' &&
      (source[i + 1] === undefined || source[i + 1] === ' ')
    ) {
      continue;
    }

    result = result + source[i];
  }

  if (result[0] === ' ') {
    return result.replace(' ', '');
  }

  return result;
}

export function random(length: number = 32, type: string = 'hex'): string {
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

    case 'numeric':
      let numeric_result: string = '';
      const numeric_bytes: any = crypto.randomBytes(length);
      for (let i: number = 0; i < numeric_bytes.length; i++) {
        numeric_result += (numeric_bytes[i] % 10).toString();
      }

      return numeric_result;

    default:
      return crypto.randomBytes(length / 2).toString('hex');
  }
}

export function add_commas(value: number): string {
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

export function fhandle(f: number, length: number = 2): string {
  const f_str: string = f.toString();

  if (f_str.includes('e-')) {
    let result_e: string = '0.'; // final value for expontential scenario
    const decimal_e: number = Number(f_str.split('e-')[1]) - 1; // zeros that will be placed after the "0."
    const value_e: string = f_str.split('e-')[0].replace('.', '');

    for (let i: number = 0; i < decimal_e; i++) {
      result_e += '0';
    }

    for (let i: number = 0; i < value_e.length; i++) {
      if (i >= length) {
        break;
      }

      result_e += value_e[i];
    }

    return result_e;
  }

  const integer: string = f_str.split('.')[0];
  const decimal: string = f_str.split('.')[1];

  if (!decimal) {
    return f_str;
  }

  let result: string = integer + '.';
  let decimal_ctr: number = 0;
  for (let i: number = 0; i < decimal.length; i++) {
    if (decimal_ctr >= length) {
      break;
    }

    if (decimal[i] !== '0' || decimal_ctr) {
      decimal_ctr++;
    }

    result += decimal[i];
  }

  return result;
}

export function sysgmt(): number {
  const time: string = new Date().toString();
  let i: number = time.indexOf('GMT');
  let gmt: string = '';

  while (true) {
    if (time[i + 3] === ' ') {
      break;
    }

    gmt = gmt + time[i + 3];

    i++;
  }

  return Number(gmt) / 100;
}

export default {
  sleep,
  str_remove_space,
  random,
  add_commas,
  fhandle,
  sysgmt,
};
