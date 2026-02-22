'use strict';

// MODULES
import crypto from 'node:crypto';

export function sleep(ms: number = 1000): Promise<void> {
  return new Promise((resolve: any, reject: any) => {
    setTimeout(resolve, ms);
  });
}

// deep freezes an object
export function freeze(source: object) {
  // returns if the surface of the object is frozen
  if (Object.isFrozen(source)) {
    return source;
  }

  Object.freeze(source);

  const values: any[] = Object.values(source);

  for (let i: number = 0; i < values.length; i++) {
    if (typeof values[i] !== 'object' || values[i] === null) {
      continue;
    }

    freeze(values[i]);
  }

  return source;
}

// removes unneccessary spaces in a string, useful for user based inputs such as name, address, etc.
// "   test   1   " => "test 1"
export function str_remove_space(source: string): string {
  let result: string = '';

  for (let i: number = 0; i < source.length; i++) {
    // "  test  1  " => "test 1"
    // if current character is empty and the next character is empty or undefined, remove it
    if (
      (source[i] === ' ' || source[i] === '\t' || source[i] === '\u00A0') &&
      (source[i + 1] === ' ' ||
        source[i + 1] === '\t' ||
        source[i + 1] === '\u00A0' ||
        source[i + 1] === undefined)
    ) {
      continue;
    }

    if (source[i] === '\t' || source[i] === '\u00A0') {
      result = result + ' ';
      continue;
    }

    result = result + source[i];
  }

  if (result[0] === ' ' || result[0] === '\t' || result[0] === '\u00A0') {
    return result.replace(result[0], '');
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

  const result: number = Number(gmt) / 100;

  return result;
}

export function base58_encode(bytes: Uint8Array): string {
  const base58: string =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let result: string = '';

  // calculate the total value of the hex bytes
  let total: bigint = BigInt(0);
  for (let i: number = 0; i < bytes.length; i++) {
    // start from the last index
    const index: number = bytes.length - i - 1;

    // calculate each hex's corresponding integer
    const value: bigint = BigInt(bytes[index] * Math.pow(256, i));

    // add them together to get the final value
    total += value;
  }

  while (total > 0) {
    const remainder: number = Number(total % 58n);
    result = base58[remainder] + result;
    total = BigInt(total / 58n);
  }

  for (let i: number = 0; i < bytes.length; i++) {
    if (bytes[i] !== 0) {
      break;
    }

    result = base58[0] + result;
  }

  return result;
}

export function base58_decode(source: string): Uint8Array {
  const base58: string =
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // zeros in front
  let zeros: number = 0;
  const values: number[] = []; // LE (little endian)

  let total: bigint = BigInt(base58.indexOf(source[0]));
  for (let i: number = 0; i < source.length - 1; i++) {
    total = total * 58n;
    total = total + BigInt(base58.indexOf(source[i + 1]));
  }

  for (let i: number = 0; i < source.length; i++) {
    if (source[i] !== '1') {
      break;
    }

    zeros++;
  }

  while (total > 0) {
    const remainder: number = Number(total % 256n);
    total = total / 256n;
    values.push(remainder);
  }

  const length: number = zeros + values.length;
  const result: Uint8Array = new Uint8Array(length);

  for (let i: number = 0; i < zeros; i++) {
    result[i] = 0;
  }

  for (let i: number = 0; i < values.length; i++) {
    result[zeros + i] = values[values.length - i - 1]; // start from the end for LE
  }

  return result;
}

// removes unneccessary dust money (fixdecimals)
// eg: 0.0051261268769453 => 0.00512
export function fixd(value: number, price: number): number {
  // minimum USD
  const min: number = 0.1;

  let fix: number = 0;
  while (price > min) {
    price = price / 10;
    fix++;
  }

  const result: number = Number(value.toFixed(fix));

  return result;
}

export default {
  sleep,
  freeze,
  str_remove_space,
  random,
  add_commas,
  fhandle,
  sysgmt,
  base58_encode,
  base58_decode,
  fixd,
};
