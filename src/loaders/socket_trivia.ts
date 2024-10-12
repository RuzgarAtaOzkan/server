'use strict';

// MODULES
import { CronJob } from 'cron';
import axios from 'axios';
import { WebSocketServer } from 'ws';

// INTERFACES
import { FastifyInstance } from 'fastify';
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';
import { ObjectId } from 'mongodb';

async function enter_questions(options: any) {
  const res = await axios.get(
    'https://opentdb.com/api.php?amount=100&category=9&difficulty=medium&type=multiple'
  );

  for (let i: number = 0; i < res.data.results.length; i++) {
    const api_question: any = res.data.results[i];

    const question: any = {
      question: api_question.question,
      answer: '',
      category: api_question.category.split(' ')[0].toLowerCase(),

      choice_a: '',
      choice_b: '',
      choice_c: '',
      choice_d: '',

      img: '',
      seen_by: '',
      created_at: new Date(),
      updated_at: new Date(),
    };

    const abcd = ['a', 'b', 'c', 'd'];
    const rand = Math.floor(Math.random() * 4);
    const answer = abcd[rand];

    question.answer = answer;
    question['choice_' + answer] = api_question.correct_answer;

    if (answer === 'a') {
      question.choice_b = api_question.incorrect_answers[0];
      question.choice_c = api_question.incorrect_answers[1];
      question.choice_d = api_question.incorrect_answers[2];
    }

    if (answer === 'b') {
      question.choice_a = api_question.incorrect_answers[0];
      question.choice_c = api_question.incorrect_answers[1];
      question.choice_d = api_question.incorrect_answers[2];
    }

    if (answer === 'c') {
      question.choice_a = api_question.incorrect_answers[0];
      question.choice_b = api_question.incorrect_answers[1];
      question.choice_d = api_question.incorrect_answers[2];
    }

    if (answer === 'd') {
      question.choice_a = api_question.incorrect_answers[0];
      question.choice_b = api_question.incorrect_answers[1];
      question.choice_c = api_question.incorrect_answers[2];
    }

    console.log(question);
    /**
     * 
     *     const insert_one_result: any = await options.db.questions.insertOne(
      question
    );

    console.log(insert_one_result.insertedId);
     */
  }

  console.log(res.data.results.length);
}

// validates the incoming cookie on the first socket connection then returns it
async function validate_connection(
  cookie: string,
  options: options_i
): Promise<any> {
  if (!cookie) {
    return null;
  }

  let sid_rest: string = '';

  const cookie_parts = cookie.split('=');

  for (let i: number = 0; i < cookie_parts.length; i++) {
    if (cookie_parts[i] === 'sid') {
      sid_rest = cookie_parts[i + 1];
    }
  }

  if (!sid_rest) {
    return null;
  }

  let sid: string = '';
  // cointrivia_sid=abdf154324; another_cookie=1123
  for (let i: number = 0; i < sid_rest.length; i++) {
    if (sid_rest[i] === ';') {
      break;
    }

    sid += sid_rest[i];
  }

  const session = JSON.parse(await options.redis.hGet('sessions', sid));

  if (!session) {
    return null;
  }

  if (
    new Date(session.created_at).valueOf() + config.env.SESSION_LIFETIME_MS <
    Date.now()
  ) {
    await options.redis.hDel('sessions', sid);

    return null;
  }

  const user = await options.db.users.findOne({
    _id: new ObjectId(session.user_id),
  });

  if (!user) {
    return null;
  }

  if (!user.hearts) {
    return null;
  }

  const profile = UTILS_SERVICES.return_user_profile(user);

  // TODO: props you don't want to send to clients
  profile.api_key = undefined;
  profile.email = undefined;
  profile.email_verified = undefined;
  delete profile.api_key;
  delete profile.email;
  delete profile.email_verified;

  return { profile: profile, sid: sid };
}

async function match_players(
  players: any,
  socket: any,
  options: any
): Promise<boolean> {
  for (let i: number = 0; i < players.length; i++) {
    if (players[i].socket.sid === socket.sid) {
      continue;
    }

    if (players[i].opp_socket) {
      continue;
    }

    if (
      socket.profile._id.toString() === players[i].socket.profile._id.toString()
    ) {
      continue;
    }

    players[socket.index].opp_socket = players[i].socket; // setting your opp socket to enemy player's socket
    players[i].opp_socket = socket; // setting your opponent's opp_socket to your socket

    // TODO: reduce players hearts by 1

    const users: any[] = await Promise.all([
      options.db.users.findOne({
        _id: socket.profile._id,
      }),
      options.db.users.findOne({
        _id: players[i].socket.profile._id,
      }),
    ]);

    await Promise.all([
      options.db.users.updateOne(
        { _id: users[0]._id },
        { $set: { hearts: users[0].hearts - 1 } }
      ),
      options.db.users.updateOne(
        { _id: users[1]._id },
        { $set: { hearts: users[1].hearts - 1 } }
      ),
    ]);

    return true;
  }

  return false;
}

async function fetch_questions(socket: any, opp_socket: any, options: any) {
  const settings: any = JSON.parse(
    await options.redis.get(config.env.DB_NAME + '_settings')
  );

  const questions_all: any[] = await options.db.questions.find({}).toArray();
  const questions: any[] = [];

  // select questions thet users hasn't yet seen before

  let ctr: number = 0;
  for (let i: number = 0; i < questions_all.length; i++) {
    if (ctr >= settings.game_question_amount) {
      break;
    }

    if (
      (questions_all[i].seen_by.includes(socket.profile._id.toString()) ||
        questions_all[i].seen_by.includes(opp_socket.profile._id.toString())) &&
      settings.game_question_seen_by
    ) {
      continue;
    }

    questions.push(questions_all[i]);
    ctr++;
  }

  // update questions seen by with players id to avoid repeat questions
  for (let i: number = 0; i < questions.length; i++) {
    await options.db.questions.updateOne(
      { _id: questions[i]._id },
      {
        $set: {
          seen_by:
            questions[i].seen_by +
            socket.profile._id +
            ' ' +
            opp_socket.profile._id +
            ' ',
        },
      }
    );
  }

  return questions;
}

async function load_socket(options: any): Promise<void> {
  //enter_questions(options);

  const settings: any = JSON.parse(
    await options.redis.get(config.env.DB_NAME + '_settings')
  );

  const game_question_interval: number = settings.game_question_interval;
  const game_question_amount: number = settings.game_question_amount;
  const game_token_win_amount: number = settings.game_token_win_amount;

  //////////////////////////////////////////
  // DEVELOPMENT
  //////////////////////////////////////////
  const questions_all = await options.db.questions.find({}).toArray();
  for (let i: number = 0; i < questions_all.length; i++) {
    options.db.questions.updateOne(
      { _id: questions_all[i]._id },
      {
        $set: {
          seen_by: '',
        },
      }
    );
  }
  const users_all: any[] = await options.db.users.find({}).toArray();
  for (let i: number = 0; i < users_all.length; i++) {
    options.db.users.updateOne(
      { _id: users_all[i]._id },
      { $set: { hearts: 5 } }
    );
  }
  //////////////////////////////////////////
  // DEVELOPMENT
  //////////////////////////////////////////

  const wss = new WebSocketServer({ port: 8080 });
  const msgs: any = {
    OPP_SEARCH: 'OPP_SEARCH',
    OPP_FOUND: 'OPP_FOUND',
    Q_NEW: 'Q_NEW', // when server sending a new question to client
    Q_CHOOSE: 'Q_CHOOSE', // when client choosing an answer
    Q_ANSWER: 'Q_ANSWER', // when server reveals the current question answer to clients
  };

  const players: any[] = [];
  const games: any[] = [];

  wss.on('connection', async function (socket: any, req: any) {
    socket.on('error', console.error);

    // cookie validation with req.headers.cookie sid then profile fetch
    const query: string = req.url.split('?')[1];

    const res_connection = await validate_connection(query, options);
    if (!res_connection) {
      socket.close();
      return;
    }

    // bind sid & profile data to current connected socket to be able to grab them in 'message' event
    socket.sid = res_connection.sid;
    socket.profile = res_connection.profile;
    socket.index = players.length;

    players.push({ socket: socket, opp_socket: null });

    const match_result = await match_players(players, socket, options);
    if (match_result) {
      const opp_socket: any = players[socket.index].opp_socket;
      const questions: any[] = await fetch_questions(
        socket,
        opp_socket,
        options
      );

      const game: any = { questions: questions, index: games.length };
      games.push(game);
      socket.game_index = game.index;
      opp_socket.game_index = game.index;

      // ! questions & game.questions points to same object array pointer

      socket.send(
        JSON.stringify({
          message: msgs.OPP_FOUND,
          opp_profile: opp_socket.profile,
          question_amount: game_question_amount,
          token_win_amount: game_token_win_amount,
        })
      );

      opp_socket.send(
        JSON.stringify({
          message: msgs.OPP_FOUND,
          opp_profile: socket.profile,
          question_amount: game_question_amount,
          token_win_amount: game_token_win_amount,
        })
      );

      for (let i: number = 0; i < game.questions.length; i++) {
        const timeout: number = (i + 1) * (game_question_interval + 5000);

        setTimeout(() => {
          const deadline: Date = new Date(Date.now() + game_question_interval);

          game.questions[i].deadline = deadline;
          game.questions[i].duration = game_question_interval;

          socket.send(
            JSON.stringify({
              message: msgs.Q_NEW,
              question: { ...game.questions[i], answer: '' },
            })
          );

          opp_socket.send(
            JSON.stringify({
              message: msgs.Q_NEW,
              question: { ...game.questions[i], answer: '' },
            })
          );

          setTimeout(() => {
            // last question answer reveal timeout
            // delete game and calculate winner
            let winner: string | null = null;
            if (i === game.questions.length - 1) {
              // ..
              let socket_corrects: number = 0;
              let opp_socket_corrects: number = 0;

              const socket_prop_name: string =
                socket.profile._id.toString() + '_answer';

              const opp_socket_prop_name: string =
                opp_socket.profile._id.toString() + '_answer';

              for (let j: number = 0; j < game.questions.length; j++) {
                if (
                  game.questions[j].answer ===
                  game.questions[j][socket_prop_name]
                ) {
                  socket_corrects++;
                }

                if (
                  game.questions[j].answer ===
                  game.questions[j][opp_socket_prop_name]
                ) {
                  opp_socket_corrects++;
                }
              }

              if (socket_corrects > opp_socket_corrects) {
                winner = socket.profile._id.toString();

                const wallet_tokens_new: number =
                  socket.profile.wallet_tokens + game_token_win_amount;
                const wallet_tokens_weekly_new: number =
                  socket.profile.wallet_tokens_weekly + game_token_win_amount;

                const wallet_tokens_monthly_new: number =
                  socket.profile.wallet_tokens_monthly + game_token_win_amount;

                // ..
                options.db.users.updateOne(
                  { _id: socket.profile._id },
                  {
                    $set: {
                      wallet_tokens: wallet_tokens_new,
                      wallet_tokens_weekly: wallet_tokens_weekly_new,
                      wallet_tokens_monthly: wallet_tokens_monthly_new,
                    },
                  }
                );
              }

              if (opp_socket_corrects > socket_corrects) {
                winner = opp_socket.profile._id.toString();

                const wallet_tokens_new: number =
                  opp_socket.profile.wallet_tokens + game_token_win_amount;
                const wallet_tokens_weekly_new: number =
                  opp_socket.profile.wallet_tokens_weekly +
                  game_token_win_amount;

                const wallet_tokens_monthly_new: number =
                  opp_socket.profile.wallet_tokens_monthly +
                  game_token_win_amount;

                // ..
                options.db.users.updateOne(
                  { _id: opp_socket.profile._id },
                  {
                    $set: {
                      wallet_tokens: wallet_tokens_new,
                      wallet_tokens_weekly: wallet_tokens_weekly_new,
                      wallet_tokens_monthly: wallet_tokens_monthly_new,
                    },
                  }
                );
              }

              if (!winner) {
                winner = 'DRAW';
              }

              socket.send(
                JSON.stringify({
                  message: msgs.Q_ANSWER,
                  question: game.questions[i],
                  winner: winner,
                })
              );

              opp_socket.send(
                JSON.stringify({
                  message: msgs.Q_ANSWER,
                  question: game.questions[i],
                  winner: winner,
                })
              );

              // triggers close event listener, we reallign games array and players game_index
              socket.close();
              opp_socket.close();

              return;
            }

            socket.send(
              JSON.stringify({
                message: msgs.Q_ANSWER,
                question: game.questions[i],
              })
            );

            opp_socket.send(
              JSON.stringify({
                message: msgs.Q_ANSWER,
                question: game.questions[i],
              })
            );

            // ..
          }, game_question_interval);

          // ..
        }, timeout);
      }
    } else {
      // TODO: notify team that a user couldn't match with any opponent on the first try
    }

    socket.on('message', function (req: any) {
      const data: any = JSON.parse(req.toString());
      const opp_socket: any = players[socket.index].opp_socket;

      if (!opp_socket) {
        return;
      }

      if (data.message === msgs.Q_SEARCH) {
        // .. requesting web socket as idle to avoid timeouts
        return;
      }

      if (data.message === msgs.Q_CHOOSE) {
        const game: any = games[socket.game_index];

        // data._id = current question id
        // data.answer = clients answer for current question

        for (let i: number = 0; i < game.questions.length; i++) {
          if (game.questions[i]._id.toString() !== data._id) {
            continue;
          }

          const now: number = new Date().valueOf();

          if (
            now <
              new Date(game.questions[i].deadline).valueOf() -
                game_question_interval ||
            now > new Date(game.questions[i].deadline).valueOf()
          ) {
            // illegal client data
            return;
          }

          if (
            data.answer.length > 1 ||
            typeof data.answer !== config.types.string
          ) {
            // illegal client data
            return;
          }

          // 1abcdf31fa_answer: "b"
          const prop_name: string = socket.profile._id.toString() + '_answer';

          game.questions[i][prop_name] = data.answer;

          break;
        }

        return;
      }
    });

    socket.on('close', function (data: any) {
      if (socket.game_index) {
        // remove game object from games pointer, reallign players game_index
        // games: [1, 2, 3, 4, 5]
        // reallign games array when a game ends and pop the ended game,
        for (let i: number = socket.game_index; i < games.length; i++) {
          if (games[i + 1]) {
            games[i + 1].index = games[i + 1].index - 1;
            games[i] = games[i + 1];
          }
        }

        games.length = games.length - 1;

        // decrease players game_index from that point because we removed the ended game from array
        for (let i: number = 0; i < players.length; i++) {
          if (players[i].socket.game_index > socket.game_index) {
            players[i].socket.game_index = players[i].socket.game_index - 1;

            players[i].opp_socket.game_index =
              players[i].opp_socket.game_index - 1;
          }
        }
      }

      // [1, 2, 3, 4, 5, 6]

      for (let i: number = socket.index; i < players.length; i++) {
        if (players[i + 1]) {
          players[i + 1].socket.index = players[i + 1].socket.index - 1;
          players[i] = players[i + 1];
        }
      }

      players.length = players.length - 1;

      socket.close();
    });
  });
}

export default load_socket;
