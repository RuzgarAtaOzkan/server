'use strict';

// INTERFACES
import { options_i } from 'interfaces/common';

// CONFIG
import config from '../config';

export async function load_socket(options: options_i): Promise<void> {
  for (let i: number = 0; i < config.blockchains.length; i++) {
    config.blockchains[i].socket_connect(options);
  }
}

export default load_socket;
