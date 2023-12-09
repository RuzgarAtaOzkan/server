// CONFIG Types

/**
 * Standard HTTP method strings
 */
export type http_methods_t =
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
export type types_t =
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
export type roles_t = 'admin' | 'user';
