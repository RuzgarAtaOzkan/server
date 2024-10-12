'use strict';

// MODULES
import { Document, ObjectId } from 'mongodb';
import { WebSocketServer } from 'ws';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import { str_remove_space } from '../utils/common';

// working principle of parse_cookie:
// " test=123; domain_sid =  abc123  ;" => "abc123"
function parse_cookie(
  cookie: string,
  name: string = config.env.SESSION_NAME
): string {
  let index: number = cookie.length; // scanning start index, first index after the session name ("domain_sid " <=)
  let value: string = '';

  for (let i: number = 0; i < cookie.length; i++) {
    // "test=123; domain_sid=123"
    let highlight: string = '';
    for (let j: number = 0; j < name.length; j++) {
      if (!cookie[i + j]) {
        break;
      }

      highlight += cookie[i + j];
    }

    if (highlight !== name) {
      continue;
    }

    index = i + name.length;

    break;
  }

  for (let i: number = index; i < cookie.length; i++) {
    if (value && (cookie[i] === ' ' || cookie[i] === ';')) {
      break;
    }

    if (cookie[i] === '=' || cookie[i] === ' ') {
      continue;
    }

    value += cookie[i];
  }

  return value;
}

// validate client's cookie to check if its admin
async function validate_admin(
  request: any,
  options: options_i
): Promise<boolean> {
  if (!request.headers.cookie) {
    return false;
  }

  const sid: string = parse_cookie(
    request.headers.cookie,
    config.env.SESSION_NAME
  );

  const session: any = JSON.parse(await options.redis.hGet('sessions', sid));

  if (!session) {
    return false;
  }

  // expired session
  if (
    new Date(session.created_at).valueOf() + config.env.SESSION_LIFETIME_MS <
    Date.now()
  ) {
    return false;
  }

  const user: Document = await options.db.users.findOne({
    _id: ObjectId.createFromHexString(session.user_id),
  });

  if (
    user.role !== config.roles.admin ||
    user.permission !== config.env.PERM_ADMIN
  ) {
    return false;
  }

  return true;
}

// anonymous chat socket
async function load_socket(options: options_i): Promise<void> {
  const wss: WebSocketServer = new WebSocketServer({
    port: Number(config.env.PORT_SOCKET),
  });

  // connected user sockets
  const users: any[] = [];

  // all messages
  const messages: any[] = [];

  // TODO: message params
  const messages_limit: number = 500; // messages length can't be bigger then this
  const messages_expiration_interval: number = config.times.one_day_ms * 3; // 3 days
  const message_interval: number = 3000; // user can only send message once every (interval) seconds
  const message_length: number = 120;

  wss.on('connection', async function (socket: any, request: any) {
    socket.on('error', console.error);

    //console.log(request.headers);
    const is_admin: boolean = await validate_admin(request, options);
    //console.log('IS_ADMIN: %d', is_admin);

    //const ip: string = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    socket.last_message_at = new Date(Date.now() - 3000);
    socket.index = users.length;
    socket.admin = is_admin;

    users.push(socket);

    // on user socket connection; limit messages that are going to client to avoid heavy traffic
    // reshape array as only messages_limit
    // we start by subtracting the limit from message length to get the starting index offset
    // then we start assigning elements from start with that offset to move last (limit) messages to the beginning
    // assume that messages limit is 5, we subtract limit from messages length (10)
    // offset becomes 5, then we start looping messages to assign them with + offset to move them into the beginning of the array
    // then we set the length of the messages to the limit
    // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]  =>  [5, 6, 7, 8, 9]
    if (messages.length > messages_limit) {
      const offset: number = messages.length - messages_limit;

      for (let i: number = 0; i < messages_limit; i++) {
        messages[i] = messages[i + offset];
      }

      messages.length = messages_limit;
    }

    // reshape array as only messages sent today, starts with oldest sent
    // assume that 4th index is the first one sent in the last 3 days, other ones are created older than 3 days
    // create another for loop inside the main one that starts at 0, then assign them to i+j with reduced messages length which is the remaining messages (messages.length - i)
    // [0, 1, 2, 3, 4, 5, 6, 7, 8]  =>  [4, 5, 6, 7, 8]
    // first message index that sent in the last 3 days
    for (let i: number = 0; i < messages.length; i++) {
      if (
        Date.now() - messages[i].created_at.valueOf() <
        messages_expiration_interval
      ) {
        for (let j: number = 0; j < messages.length - i; j++) {
          messages[j] = messages[i + j];
        }

        messages.length = messages.length - i;

        break;
      }
    }

    socket.send(JSON.stringify({ messages: messages }));

    socket.on('message', function (msg: any) {
      const message: string = str_remove_space(msg.toString());

      if (!message) {
        //socket.send(JSON.stringify({ error: 'missing message' }));

        return;
      }

      if (message.length > message_length) {
        socket.send(
          JSON.stringify({ error: 'Göndermeye çalıştığınız mesaj çok uzun' })
        ); // message is too long

        return;
      }

      if (Date.now() - socket.last_message_at.valueOf() < message_interval) {
        socket.send(
          JSON.stringify({
            error: 'Mesaj göndermeden önce birkaç saniye bekleyin',
          })
        ); // too frequent messages

        return;
      }

      const packet: object = {
        admin: socket.admin,
        message: message,
        created_at: new Date(),
      };

      for (let i: number = 0; i < users.length; i++) {
        users[i].send(JSON.stringify(packet));
      }

      messages.push(packet);

      socket.last_message_at = new Date();
    });

    socket.on('close', function (data: any) {
      // [0, 1, 2, 3, 4, 5]
      for (let i: number = socket.index; i < users.length; i++) {
        if (users[i + 1]) {
          users[i] = users[i + 1];
          users[i].index = users[i].index - 1;
        }
      }

      if (!users.length) {
        return;
      }

      users.length = users.length - 1;
    });
  });
}

export default load_socket;
