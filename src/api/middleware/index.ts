'use strict';

/**
 *
 * FASTIFY ROUTE BINDING MIDDLEWARE FUNCTIONS
 *
 */
export function prevalidation(
  calls: Function | Function[] | null,
  options: any
): (request: any, reply: any) => Promise<void> {
  if (calls === null) {
    return async function (request: any, reply: any): Promise<void> {
      return;
    };
  }

  return async function (request: any, reply: any): Promise<void> {
    if (Array.isArray(calls)) {
      if (!calls.length) {
        return;
      }

      const promises: Promise<boolean>[] = [];
      for (let i: number = 0; i < calls.length; i++) {
        // cprom stands for current promise or callback promise;
        const cprom: Promise<boolean> = calls[i](request, options);
        promises.push(cprom);
      }

      const results: boolean[] = await Promise.all(promises);

      for (let i: number = 0; i < results.length; i++) {
        if (results[i] === false) {
          reply.status(401).send('unauthorized');

          return;
        }
      }

      return;
    }

    const result = await calls(request, options);

    if (result === false) {
      reply.status(401).send('unauthorized');

      return;
    }

    return;
  };
}

// Dont forget that these middle ware functions are returning an async function to pass into the fastify middlewares.
export default {
  prevalidation,
};
