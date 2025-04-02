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
// " bar=foo; domain_sid =  abc123  ;" => "abc123"
function parse_cookie(
  cookie: string,
  name: string = config.ENV_SESSION_NAME
): string {
  let index: number = cookie.length; // scanning start index, first index after the session name ("domain_sid " <=)
  let value: string = '';

  for (let i: number = 0; i < cookie.length; i++) {
    // "test=123; domain_sid=123"
    let highlight: string = '';
    for (let j: number = 0; j < name.length; j++) {
      if (cookie[i + j] === undefined) {
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

  // index = "... domain_sid{@}"

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
  if (request.headers.cookie === undefined) {
    return false;
  }

  const sid: string = parse_cookie(request.headers.cookie);

  const session: any | null = JSON.parse(
    await options.redis.hGet('sessions', sid)
  );

  if (session === null) {
    return false;
  }

  const expire_at: number =
    new Date(session.created_at).valueOf() + config.ENV_SESSION_LIFETIME_MS;

  if (expire_at < Date.now()) {
    // expired session
    return false;
  }

  const user: Document = await options.db.users.findOne({
    _id: ObjectId.createFromHexString(session.user_id),
  });

  if (
    user.role !== config.role_admin ||
    user.role_key !== config.ENV_ROLE_KEY_ADMIN
  ) {
    return false;
  }

  return true;
}

function blacklist_check(message: string, blacklist: string[]): boolean {
  // only a to z, A to Z, 0 to 9 for the entire line
  const exp = new RegExp(/^[a-zA-Z0-9ÇçİıÖöŞşÜüĞğ?!., ]+$/);

  if (exp.test(message) === false) {
    return false;
  }

  const words: string[] = message.toLowerCase().split(' ');

  for (let i: number = 0; i < words.length; i++) {
    const word: string = words[i]; // TODO: remove duplicate letters

    let word_light: string = '';
    for (let j: number = 0; j < word.length; j++) {
      if (word[j] !== word[j + 1]) {
        word_light = word_light + word[j];
      }
    }

    for (let j: number = 0; j < blacklist.length; j++) {
      if (word_light.includes(blacklist[j])) {
        return false;
      }
    }
  }

  return true;
}

function message_validate(
  socket: any,
  message: string,
  messages: any[],
  blacklist: string[],
  sconfig: any
): boolean {
  // on user socket message; limit messages that are going to client to avoid heavy traffic
  // reshape array as only messages_limit
  // we start by subtracting the limit from message length to get the starting index offset
  // then we start assigning elements from start with that offset to move last (limit) messages to the beginning
  // assume that messages limit is 5, we subtract limit from messages length (10)
  // offset becomes 5, then we start looping messages to assign them with + offset to move them into the beginning of the array
  // then we set the length of the messages to the limit
  // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]  =>  [5, 6, 7, 8, 9]
  if (messages.length > sconfig.MESSAGE_LIMIT) {
    const offset: number = messages.length - sconfig.MESSAGE_LIMIT;

    for (let i: number = 0; i < sconfig.MESSAGE_LIMIT; i++) {
      messages[i] = messages[i + offset];
    }

    messages.length = sconfig.MESSAGE_LIMIT;
  }

  // reshape array as only messages sent messages_exp_interval, starts with oldest sent
  // assume that 4th index is the first one sent in the last messages_exp_interval days, other ones are created older than messages_exp_interval days
  // create another for loop inside the main one that starts at 0, then assign them to i+j with reduced messages length which is the remaining messages (messages.length - i)
  // [0, 1, 2, 3, 4, 5, 6, 7, 8]  =>  [4, 5, 6, 7, 8]
  // first message index that sent in the last 3 days
  /*
  for (let i: number = 0; i < messages.length; i++) {
    if (
      Date.now() - messages[i].created_at.valueOf() <
      sconfig.MESSAGE_EXP_INTERVAL
    ) {
      const length = messages.length - i;

      for (let j: number = 0; j < length; j++) {
        messages[j] = messages[j + i];
      }

      messages.length = length;

      break;
    }
  }
  */

  if (!message) {
    //socket.send(JSON.stringify({ error: 'missing message' }));

    return false;
  }

  if (message.length > sconfig.MESSAGE_LENGTH) {
    socket.send(JSON.stringify({ error: 'ERR_LONG_MESSAGE' })); // message is too long

    return false;
  }

  if (
    Date.now() - socket.last_message_at.valueOf() <
    sconfig.MESSAGE_SEND_INTERVAL
  ) {
    socket.send(
      JSON.stringify({
        error: 'ERR_FREQUENT_MESSAGE',
      })
    ); // too frequent messages

    return false;
  }

  if (blacklist_check(message, blacklist) === false) {
    socket.send(
      JSON.stringify({
        error: 'ERR_INAPPROPRIATE_MESSAGE',
      })
    ); // inappropriate message

    return false;
  }

  return true;
}

async function connect(
  socket: any,
  request: any,
  users: any[],
  sconfig: any,
  options: options_i
): Promise<boolean> {
  if (
    request.headers.origin !== config.ENV_URL_UI &&
    request.headers.origin !== config.ENV_URL_UI_LOCAL
  ) {
    socket.close();
    return false;
  }

  // reshape users array as only those who sent message in the last USER_EXP_INTERVAL period, otherwise close their connection for optimization
  for (let i: number = 0; i < users.length; i++) {
    const now = Date.now();

    // i = first expired index
    if (now - users[i].last_message_at.valueOf() > sconfig.USER_EXP_INTERVAL) {
      let i_valid: number = users.length; // first valid index after expired encounter

      for (let j: number = i; j < users.length; j++) {
        if (
          now - users[j].last_message_at.valueOf() <
          sconfig.USER_EXP_INTERVAL
        ) {
          i_valid = j;

          break; // break the loop at the first valid encounter!
        }
      }

      //        {width}
      // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

      for (let j: number = 0; j < users.length - i_valid; j++) {
        if (
          now - users[j + i].last_message_at.valueOf() >
          sconfig.USER_EXP_INTERVAL
        ) {
          users[j + i].close();
        }

        users[j + i] = users[j + i_valid];
        users[j + i].index = j + i;
      }

      const width_exp: number = i_valid - i; // expired's length

      users.length = users.length - width_exp;
    }
  }

  const admin: boolean = await validate_admin(request, options);

  // bind data to current connected socket
  socket.admin = admin;
  socket.index = users.length;
  socket.last_message_at = new Date(Date.now() - sconfig.MESSAGE_SEND_INTERVAL);

  users.push(socket);

  return true;
}

// anonymous chat socket
export async function load_socket(
  options: options_i
): Promise<WebSocketServer> {
  const wss: WebSocketServer = new WebSocketServer({
    host: config.ENV_HOST,
    port: config.ENV_PORT_SOCKET,
  });

  // TODO: edit params
  const sconfig: any = {
    USER_EXP_INTERVAL: config.time_one_hour_ms / 10,
    MESSAGE_LIMIT: 1000,
    MESSAGE_EXP_INTERVAL: config.time_one_day_ms * 3,
    MESSAGE_SEND_INTERVAL: 3000,
    MESSAGE_LENGTH: 100,
  };

  // connected user sockets
  const users: any[] = [];

  // all messages
  const messages: any[] = [];

  // forbidden words to send
  const blacklist: string[] = ['yasak', 'uygunsuz', 'kelime'];

  wss.on('connection', async function (socket: any, request: any) {
    socket.on('error', console.error);

    const conn: boolean = await connect(
      socket,
      request,
      users,
      sconfig,
      options
    );

    if (conn === false) {
      return;
    }

    socket.send(JSON.stringify({ messages: messages }));

    socket.on('message', function (msg: any) {
      const message: string = str_remove_space(msg.toString());

      const valid: boolean = message_validate(
        socket,
        message,
        messages,
        blacklist,
        sconfig
      );

      if (valid === false) {
        return;
      }

      const packet: object = {
        admin: socket.admin,
        message: message,
        created_at: new Date(),
      };

      for (let i: number = 0; i < users.length; i++) {
        // TODO! configure date before sending to client with Turkey time when server uploaded on the Frankfurt server
        users[i].send(JSON.stringify(packet));
      }

      messages.push(packet);

      socket.last_message_at = new Date();
    });

    socket.on('close', function (data: any) {
      // [0, 1, 2, 3, 4, 5] => [0, 1, 2, 4, 5]
      for (let i: number = socket.index; i < users.length; i++) {
        if (users[i + 1]) {
          users[i] = users[i + 1];
          users[i].index = users[i].index - 1;
        }
      }

      if (users.length <= 0) {
        return;
      }

      users.length = users.length - 1;
    });
  });

  return wss;
}

export default load_socket;
