// CONFIG Types

/**
 * Standard HTTP method strings
 */
export type http_method_t =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'OPTIONS';

/**
 *  dev data types
 */
export type type_t =
  | 'objectId'
  | 'string'
  | 'number'
  | 'float'
  | 'date'
  | 'double'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'object'
  | 'array'
  | 'function'
  | 'bool'
  | 'int';

/**
 *  roles
 */
export type role_t = 'user' | 'admin';

// blockchains
export type blockchain_t = 'solana' | 'ethereum' | 'bitcoin';
