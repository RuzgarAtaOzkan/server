'use strict';

// MODULES
import fs from 'fs';
import axios from 'axios';
import crypto from 'node:crypto';
import validator from 'validator';

// INTERFACES
import { Document, InsertOneResult, ObjectId } from 'mongodb';

// CONFIG
import config from '../config';

// UTILS
import UTILS_SERVICES from '../utils/services';
import UTILS_COMMON from '../utils/common';

class service_blockchain_init {
  private readonly options: any;
  private readonly validator: any;
  private readonly api_keys_0x: string[];
  private api_keys_0x_index: number;
  private readonly tokens: any;
  private readonly chains: any;
  private readonly factory: any;

  constructor(options: any) {
    this.options = options;

    this.validator = new UTILS_SERVICES.validator_blockchain_init(options);

    this.api_keys_0x = config.env.API_KEY_0X.split(' ');
    this.api_keys_0x_index = 0;

    this.tokens = {
      '1': [], // Ethereum Mainnet
      '56': [], // Binance Smart Chain
      '137': [], // Polygon
      '250': [], // Fantom
      '42161': [], // Arbitrum
      '42220': [], // Celo
      '43114': [], // Avalanche
      '11155111': [
        {
          name: 'SepoliaETH',
          symbol: 'ETH',
          img: '/images/token.png',
          decimals: 18,
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          chain_id: 11155111,
        },
        {
          name: 'Wrapped Ether',
          symbol: 'WETH',
          img: '/images/token.png',
          decimals: 18,
          address: '0xfff9976782d46cc05630d1f6ebab18b2324d6b14',
          chain_id: 11155111,
        },
        {
          name: 'ChainLink Token',
          symbol: 'LINK',
          img: '/images/token.png',
          decimals: 18,
          address: '0x779877A7b0d9e8603169ddbd7836e478b4624789',
          chain_id: 11155111,
        },
        {
          name: 'Uniswap',
          symbol: 'UNI',
          img: '/images/token.png',
          decimals: 18,
          address: '0x1f9840a85d5aF5bf1d1762d925bdaddc4201f984',
          chain_id: 11155111,
        },
      ], // Sepolia
    };

    this.chains = config.blockchain_chains;

    this.factory = {
      standard: {
        abi: [
          {
            inputs: [
              {
                internalType: 'string',
                name: 'name_',
                type: 'string',
              },
              {
                internalType: 'string',
                name: 'symbol_',
                type: 'string',
              },
              {
                internalType: 'uint8',
                name: 'decimals_',
                type: 'uint8',
              },
              {
                internalType: 'uint256',
                name: 'totalSupply_',
                type: 'uint256',
              },
              {
                internalType: 'address',
                name: 'serviceFeeReceiver_',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'serviceFee_',
                type: 'uint256',
              },
            ],
            stateMutability: 'payable',
            type: 'constructor',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Approval',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'OwnershipTransferred',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'token',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'enum TokenType',
                name: 'tokenType',
                type: 'uint8',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'version',
                type: 'uint256',
              },
            ],
            name: 'TokenCreated',
            type: 'event',
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
              },
              {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
              },
              {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
              },
            ],
            name: 'Transfer',
            type: 'event',
          },
          {
            inputs: [],
            name: 'VERSION',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'owner',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
            ],
            name: 'allowance',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'approve',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'account',
                type: 'address',
              },
            ],
            name: 'balanceOf',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'decimals',
            outputs: [
              {
                internalType: 'uint8',
                name: '',
                type: 'uint8',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
              },
            ],
            name: 'decreaseAllowance',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'spender',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'addedValue',
                type: 'uint256',
              },
            ],
            name: 'increaseAllowance',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'name',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'owner',
            outputs: [
              {
                internalType: 'address',
                name: '',
                type: 'address',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'renounceOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [],
            name: 'symbol',
            outputs: [
              {
                internalType: 'string',
                name: '',
                type: 'string',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [],
            name: 'totalSupply',
            outputs: [
              {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'transfer',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'sender',
                type: 'address',
              },
              {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
              },
              {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
              },
            ],
            name: 'transferFrom',
            outputs: [
              {
                internalType: 'bool',
                name: '',
                type: 'bool',
              },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
          {
            inputs: [
              {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
              },
            ],
            name: 'transferOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        bytecode:
          '608060405260405162002101380380620021018339818101604052810190620000299190620005af565b620000496200003d6200018560201b60201c565b6200018d60201b60201c565b85600390805190602001906200006192919062000448565b5084600490805190602001906200007a92919062000448565b5083600560006101000a81548160ff021916908360ff160217905550620000b7620000aa6200025160201b60201c565b846200027a60201b60201c565b3073ffffffffffffffffffffffffffffffffffffffff16620000de6200025160201b60201c565b73ffffffffffffffffffffffffffffffffffffffff167f56358b41df5fa59f5639228f0930994cbdde383c8a8fd74e06c04e1deebe35626000600c60405162000129929190620006c0565b60405180910390a38173ffffffffffffffffffffffffffffffffffffffff166108fc829081150290604051600060405180830381858888f1935050505015801562000178573d6000803e3d6000fd5b5050505050505062000a6a565b600033905090565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415620002ed576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401620002e490620006ed565b60405180910390fd5b62000301600083836200042b60201b60201c565b6200031d816006546200043060201b620008941790919060201c565b6006819055506200037c81600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020546200043060201b620008941790919060201c565b600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516200041f91906200070f565b60405180910390a35050565b505050565b600081836200044091906200079c565b905092915050565b8280546200045690620008a3565b90600052602060002090601f0160209004810192826200047a5760008555620004c6565b82601f106200049557805160ff1916838001178555620004c6565b82800160010185558215620004c6579182015b82811115620004c5578251825591602001919060010190620004a8565b5b509050620004d59190620004d9565b5090565b5b80821115620004f4576000816000905550600101620004da565b5090565b60006200050f620005098462000755565b6200072c565b9050828152602081018484840111156200052857600080fd5b620005358482856200086d565b509392505050565b6000815190506200054e8162000a1c565b92915050565b600082601f8301126200056657600080fd5b815162000578848260208601620004f8565b91505092915050565b600081519050620005928162000a36565b92915050565b600081519050620005a98162000a50565b92915050565b60008060008060008060c08789031215620005c957600080fd5b600087015167ffffffffffffffff811115620005e457600080fd5b620005f289828a0162000554565b965050602087015167ffffffffffffffff8111156200061057600080fd5b6200061e89828a0162000554565b95505060406200063189828a0162000598565b94505060606200064489828a0162000581565b93505060806200065789828a016200053d565b92505060a06200066a89828a0162000581565b9150509295509295509295565b620006828162000859565b82525050565b600062000697601f836200078b565b9150620006a482620009dc565b602082019050919050565b620006ba8162000842565b82525050565b6000604082019050620006d7600083018562000677565b620006e66020830184620006af565b9392505050565b60006020820190508181036000830152620007088162000688565b9050919050565b6000602082019050620007266000830184620006af565b92915050565b6000620007386200074b565b9050620007468282620008d9565b919050565b6000604051905090565b600067ffffffffffffffff8211156200077357620007726200099c565b5b6200077e82620009cb565b9050602081019050919050565b600082825260208201905092915050565b6000620007a98262000842565b9150620007b68362000842565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff03821115620007ee57620007ed6200090f565b5b828201905092915050565b6000620008068262000822565b9050919050565b60008190506200081d8262000a05565b919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600060ff82169050919050565b600062000866826200080d565b9050919050565b60005b838110156200088d57808201518184015260208101905062000870565b838111156200089d576000848401525b50505050565b60006002820490506001821680620008bc57607f821691505b60208210811415620008d357620008d26200096d565b5b50919050565b620008e482620009cb565b810181811067ffffffffffffffff821117156200090657620009056200099c565b5b80604052505050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b6000601f19601f8301169050919050565b7f45524332303a206d696e7420746f20746865207a65726f206164647265737300600082015250565b6008811062000a195762000a186200093e565b5b50565b62000a2781620007f9565b811462000a3357600080fd5b50565b62000a418162000842565b811462000a4d57600080fd5b50565b62000a5b816200084c565b811462000a6757600080fd5b50565b6116878062000a7a6000396000f3fe608060405234801561001057600080fd5b50600436106100f55760003560e01c8063715018a611610097578063a9059cbb11610066578063a9059cbb1461028a578063dd62ed3e146102ba578063f2fde38b146102ea578063ffa1ad7414610306576100f5565b8063715018a6146102145780638da5cb5b1461021e57806395d89b411461023c578063a457c2d71461025a576100f5565b806323b872dd116100d357806323b872dd14610166578063313ce5671461019657806339509351146101b457806370a08231146101e4576100f5565b806306fdde03146100fa578063095ea7b31461011857806318160ddd14610148575b600080fd5b610102610324565b60405161010f9190611149565b60405180910390f35b610132600480360381019061012d9190610f90565b6103b6565b60405161013f919061112e565b60405180910390f35b6101506103d4565b60405161015d919061122b565b60405180910390f35b610180600480360381019061017b9190610f41565b6103de565b60405161018d919061112e565b60405180910390f35b61019e6104b7565b6040516101ab9190611246565b60405180910390f35b6101ce60048036038101906101c99190610f90565b6104ce565b6040516101db919061112e565b60405180910390f35b6101fe60048036038101906101f99190610edc565b610581565b60405161020b919061122b565b60405180910390f35b61021c6105ca565b005b6102266105de565b6040516102339190611113565b60405180910390f35b610244610607565b6040516102519190611149565b60405180910390f35b610274600480360381019061026f9190610f90565b610699565b604051610281919061112e565b60405180910390f35b6102a4600480360381019061029f9190610f90565b610766565b6040516102b1919061112e565b60405180910390f35b6102d460048036038101906102cf9190610f05565b610784565b6040516102e1919061122b565b60405180910390f35b61030460048036038101906102ff9190610edc565b61080b565b005b61030e61088f565b60405161031b919061122b565b60405180910390f35b6060600380546103339061135b565b80601f016020809104026020016040519081016040528092919081815260200182805461035f9061135b565b80156103ac5780601f10610381576101008083540402835291602001916103ac565b820191906000526020600020905b81548152906001019060200180831161038f57829003601f168201915b5050505050905090565b60006103ca6103c36108aa565b84846108b2565b6001905092915050565b6000600654905090565b60006103eb848484610a7d565b6104ac846103f76108aa565b6104a78560405180606001604052806028815260200161160560289139600260008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600061045d6108aa565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610d169092919063ffffffff16565b6108b2565b600190509392505050565b6000600560009054906101000a900460ff16905090565b60006105776104db6108aa565b8461057285600260006104ec6108aa565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008973ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461089490919063ffffffff16565b6108b2565b6001905092915050565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b6105d2610d6b565b6105dc6000610de9565b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6060600480546106169061135b565b80601f01602080910402602001604051908101604052809291908181526020018280546106429061135b565b801561068f5780601f106106645761010080835404028352916020019161068f565b820191906000526020600020905b81548152906001019060200180831161067257829003601f168201915b5050505050905090565b600061075c6106a66108aa565b846107578560405180606001604052806025815260200161162d60259139600260006106d06108aa565b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008a73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610d169092919063ffffffff16565b6108b2565b6001905092915050565b600061077a6107736108aa565b8484610a7d565b6001905092915050565b6000600260008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b610813610d6b565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610883576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161087a9061118b565b60405180910390fd5b61088c81610de9565b50565b600c81565b600081836108a2919061127d565b905092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610922576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016109199061120b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610992576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610989906111ab565b60405180910390fd5b80600260008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92583604051610a70919061122b565b60405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610aed576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ae4906111eb565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610b5d576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b549061116b565b60405180910390fd5b610b68838383610ead565b610bd4816040518060600160405280602681526020016115df60269139600160008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054610d169092919063ffffffff16565b600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550610c6981600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205461089490919063ffffffff16565b600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610d09919061122b565b60405180910390a3505050565b6000838311158290610d5e576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d559190611149565b60405180910390fd5b5082840390509392505050565b610d736108aa565b73ffffffffffffffffffffffffffffffffffffffff16610d916105de565b73ffffffffffffffffffffffffffffffffffffffff1614610de7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610dde906111cb565b60405180910390fd5b565b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff169050816000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b505050565b600081359050610ec1816115b0565b92915050565b600081359050610ed6816115c7565b92915050565b600060208284031215610eee57600080fd5b6000610efc84828501610eb2565b91505092915050565b60008060408385031215610f1857600080fd5b6000610f2685828601610eb2565b9250506020610f3785828601610eb2565b9150509250929050565b600080600060608486031215610f5657600080fd5b6000610f6486828701610eb2565b9350506020610f7586828701610eb2565b9250506040610f8686828701610ec7565b9150509250925092565b60008060408385031215610fa357600080fd5b6000610fb185828601610eb2565b9250506020610fc285828601610ec7565b9150509250929050565b610fd5816112d3565b82525050565b610fe4816112e5565b82525050565b6000610ff582611261565b610fff818561126c565b935061100f818560208601611328565b611018816113eb565b840191505092915050565b600061103060238361126c565b915061103b826113fc565b604082019050919050565b600061105360268361126c565b915061105e8261144b565b604082019050919050565b600061107660228361126c565b91506110818261149a565b604082019050919050565b600061109960208361126c565b91506110a4826114e9565b602082019050919050565b60006110bc60258361126c565b91506110c782611512565b604082019050919050565b60006110df60248361126c565b91506110ea82611561565b604082019050919050565b6110fe81611311565b82525050565b61110d8161131b565b82525050565b60006020820190506111286000830184610fcc565b92915050565b60006020820190506111436000830184610fdb565b92915050565b600060208201905081810360008301526111638184610fea565b905092915050565b6000602082019050818103600083015261118481611023565b9050919050565b600060208201905081810360008301526111a481611046565b9050919050565b600060208201905081810360008301526111c481611069565b9050919050565b600060208201905081810360008301526111e48161108c565b9050919050565b60006020820190508181036000830152611204816110af565b9050919050565b60006020820190508181036000830152611224816110d2565b9050919050565b600060208201905061124060008301846110f5565b92915050565b600060208201905061125b6000830184611104565b92915050565b600081519050919050565b600082825260208201905092915050565b600061128882611311565b915061129383611311565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156112c8576112c761138d565b5b828201905092915050565b60006112de826112f1565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600060ff82169050919050565b60005b8381101561134657808201518184015260208101905061132b565b83811115611355576000848401525b50505050565b6000600282049050600182168061137357607f821691505b60208210811415611387576113866113bc565b5b50919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000601f19601f8301169050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b7f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160008201527f6464726573730000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b7f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572600082015250565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f7265737300000000000000000000000000000000000000000000000000000000602082015250565b6115b9816112d3565b81146115c457600080fd5b50565b6115d081611311565b81146115db57600080fd5b5056fe45524332303a207472616e7366657220616d6f756e7420657863656564732062616c616e636545524332303a207472616e7366657220616d6f756e74206578636565647320616c6c6f77616e636545524332303a2064656372656173656420616c6c6f77616e63652062656c6f77207a65726fa26469706673582212203909faf3e5aa11cfd4eeb5cede7a43e5927725a0af9f9f067554bcb7f1b55be264736f6c63430008040033',
      },
    };

    // Get tokens from supported chains
    // #service: CoinGecko.com
    axios
      .get('https://tokens.coingecko.com/ethereum/all.json')
      .then((res: any) => {
        this.tokens['1'].push({
          chain_id: 1,
          img: '/images/ethereum.png',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['1'].push(token);
        }
      });

    axios
      .get('https://tokens.coingecko.com/binance-smart-chain/all.json')
      .then((res: any) => {
        this.tokens['56'].push({
          chain_id: 56,
          img: '/images/bnb.png',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['56'].push(token);
        }
      });

    axios
      .get('https://tokens.coingecko.com/polygon-pos/all.json')
      .then((res: any) => {
        this.tokens['137'].push({
          chain_id: 137,
          img: '/images/polygon.png',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Polygon',
          symbol: 'MATIC',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['137'].push(token);
        }
      });

    axios
      .get('https://tokens.coingecko.com/fantom/all.json')
      .then((res: any) => {
        this.tokens['250'].push({
          chain_id: 250,
          img: '/images/fantom.png',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Fantom',
          symbol: 'FTM',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['250'].push(token);
        }
      });

    axios
      .get('https://tokens.coingecko.com/arbitrum-one/all.json')
      .then((res: any) => {
        this.tokens['42161'].push({
          chain_id: 42161,
          img: '/images/arbitrum.png',
          address: '0x912Ce59144191c1204e64559fe8253a0e49e6548',
          name: 'Arbitrum',
          symbol: 'ARB',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['42161'].push(token);
        }
      });

    axios.get('https://tokens.coingecko.com/celo/all.json').then((res: any) => {
      this.tokens['42220'].push({
        chain_id: 42220,
        img: '/images/celo.png',
        address: '0x471ece3750da237f93b8e339c536989b8978a438',
        name: 'Celo',
        symbol: 'CELO',
        decimals: 18,
      });

      for (let i: number = 0; i < res.data.tokens.length; i++) {
        const token = {
          chain_id: res.data.tokens[i].chainId,
          img: res.data.tokens[i].logoURI,
          address: res.data.tokens[i].address,
          name: res.data.tokens[i].name,
          symbol: res.data.tokens[i].symbol,
          decimals: res.data.tokens[i].decimals,
        };

        this.tokens['42220'].push(token);
      }
    });

    axios
      .get('https://tokens.coingecko.com/avalanche/all.json')
      .then((res: any) => {
        this.tokens['43114'].push({
          chain_id: 43114,
          img: '/images/avalanche.png',
          address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
          name: 'Avalanche',
          symbol: 'AVAX',
          decimals: 18,
        });

        for (let i: number = 0; i < res.data.tokens.length; i++) {
          const token = {
            chain_id: res.data.tokens[i].chainId,
            img: res.data.tokens[i].logoURI,
            address: res.data.tokens[i].address,
            name: res.data.tokens[i].name,
            symbol: res.data.tokens[i].symbol,
            decimals: res.data.tokens[i].decimals,
          };

          this.tokens['43114'].push(token);
        }
      });
  }

  async get_tokens(credentials: any): Promise<any> {
    await this.validator.get_tokens(credentials, this.chains);

    const tokens_search: any[] = [];

    const chain_id: string = credentials.chain_id || '1'; // Ethereum Mainnet as default;
    let limit: number = 26;
    let limit_ctr: number = 0;

    for (let i: number = 0; i < this.tokens[chain_id].length; i++) {
      if (limit_ctr >= limit) {
        break;
      }

      if (!credentials.search) {
        tokens_search.push(this.tokens[chain_id][i]);
        limit_ctr++;

        continue;
      }

      if (
        this.tokens[chain_id][i].address
          .toLowerCase()
          .includes(credentials.search.toLowerCase()) ||
        this.tokens[chain_id][i].name
          .toLowerCase()
          .includes(credentials.search.toLowerCase()) ||
        this.tokens[chain_id][i].symbol
          .toLowerCase()
          .includes(credentials.search.toLowerCase())
      ) {
        tokens_search.push(this.tokens[chain_id][i]);

        limit_ctr++;
      }
    }

    return tokens_search;
  }

  async factory_get(credentials: any): Promise<any> {
    await this.validator.factory_get(credentials, this.factory);
    return this.factory[credentials.type];
  }

  async factory_create(credentials: any): Promise<any> {
    await this.validator.factory_create(credentials, this.chains, this.factory);

    /**
     * Supported crypto scans that have valid api for verifying contracts
     */
    const chains: any = {
      '1': {
        api_key: config.env.API_KEY_ETHERSCAN,
        url: 'https://api.etherscan.io/api',
      },
      '56': {
        api_key: config.env.API_KEY_BSCSCAN,
        url: 'https://api.bscscan.io/api',
      },
      '97': {
        api_key: config.env.API_KEY_BSCSCAN,
        url: 'https://api-testnet.bscscan.com/api',
      },
      '137': {
        api_key: config.env.API_KEY_POLYGONSCAN,
        url: 'https://api.polygonscan.com/api',
      },
      '250': {
        api_key: config.env.API_KEY_FTMSCAN,
        url: 'https://api.ftmscan.com/api',
      },
      '42161': {
        api_key: config.env.API_KEY_ARBISCAN,
        url: 'https://api.arbiscan.io/api',
      },
      '11155111': {
        api_key: config.env.API_KEY_ETHERSCAN,
        url: 'https://api-sepolia.etherscan.io/api',
      },
    };

    if (!chains[credentials.chain_id]) {
      return;
    }

    /* compiler versions
     *
     *
     * https://bscscan.com/verifyContract
     *
     *
     * v0.8.24+commit.e11b9ed9
     * v0.8.23+commit.f704f362
     * v0.8.22+commit.4fc1097e
     *
     * v0.8.9+commit.e5eed63a
     * v0.8.8+commit.dddeac2f
     * v0.8.7+commit.e28d00a7
     * v0.8.6+commit.11564f7e
     * v0.8.5+commit.a4f2e591
     * v0.8.4+commit.c7e474f2
     *
     */

    const factory: any = {
      standard: {
        path: process.cwd() + '/contracts/StandardToken.sol',
        contract_name: 'StandardToken',
        version: 'v0.8.4+commit.c7e474f2',
      },
      liquidity_generator:
        process.cwd() + '/contracts/LiquidityGeneratorToken.sol',
      contract_name: 'LiqudityGeneratorToken',
      version: 'v0.8.4+commit.c7e474f2',
    };

    const source_code: string = fs.readFileSync(
      factory[credentials.type].path,
      'utf-8'
    );

    const form: string = `contractaddress=${
      credentials.contract_address
    }&apikey=${
      chains[credentials.chain_id].api_key
    }&codeformat=solidity-single-file&contractname=${
      factory[credentials.type].contract_name
    }&optimizationUsed=0&compilerversion=${
      factory[credentials.type].version
    }&sourceCode=${source_code}&module=contract&action=verifysourcecode`;

    const res = await axios.post(chains[credentials.chain_id].url, form, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return res.data;
  }

  async audits_create(credentials: any): Promise<any> {
    await this.validator.audits_create(credentials);

    // write all audits hash into buffer
    const audits_hash = await this.options.redis.hGetAll('audits');
    let audits: any = [];

    // convert audit hashes into array as objects
    // '0x123': { address: '0x123' } => [{ address: '0x123' }]
    for (const key in audits_hash) {
      audits.push(JSON.parse(audits_hash[key]));
    }

    // filter existing audits incase they include incoming audit address
    audits = audits.filter((current: any, index: number) => {
      if (current.address.toLowerCase() !== credentials.address.toLowerCase()) {
        return current;
      }
    });

    // push new audit
    audits.push({
      address: credentials.address.toLowerCase(),
      name: credentials.name,
      symbol: credentials.symbol,
      chain_id: credentials.chain_id,
      created_at: new Date(),
    });

    // sort audits by date
    for (let i: number = 0; i < audits.length; i++) {
      for (let j: number = 0; j < audits.length; j++) {
        if (audits[j + 1]) {
          const current: any = audits[j];
          const next: any = audits[j + 1];

          if (
            new Date(current.created_at).valueOf() <
            new Date(next.created_at).valueOf()
          ) {
            audits[j] = next;
            audits[j + 1] = current;
          }
        }
      }
    }

    // limit length of audits by offset
    if (audits.length > 20) {
      audits.length = 20;
    }

    // delete all audits
    for (let i: number = 0; i < audits.length; i++) {
      await this.options.redis.hDel('audits', audits[i].address.toLowerCase());
    }

    // set new  audits
    for (let i: number = 0; i < audits.length; i++) {
      await this.options.redis.hSet(
        'audits',
        audits[i].address.toLowerCase(),
        JSON.stringify(audits[i])
      );
    }

    return audits;
  }

  async audits_get(credentials: any): Promise<any> {
    const audits_hash = await this.options.redis.hGetAll('audits');
    const audits: any = [];

    for (const key in audits_hash) {
      audits.push(JSON.parse(audits_hash[key]));
    }

    return audits;
  }

  async swap_quote(credentials: any): Promise<any | null> {
    await this.validator.swap_quote(credentials, this.chains);

    // TODO:

    const query: string = '?' + credentials.url.split('?')[1];

    const url: string =
      'https://' +
      this.chains[credentials.chain_id]['0x_param'] +
      'api.0x.org/swap/v1/quote' +
      query;

    this.api_keys_0x_index++;
    if (this.api_keys_0x_index >= this.api_keys_0x.length) {
      this.api_keys_0x_index = 0;
    }

    const api_key_0x: string = this.api_keys_0x[this.api_keys_0x_index];

    const res: any = await axios.get(url, {
      headers: { '0x-api-key': api_key_0x },
    });

    return res.data;
  }

  async swap_price(credentials: any): Promise<any | null> {
    await this.validator.swap_price(credentials, this.chains);

    const query: string = '?' + credentials.url.split('?')[1];

    const url: string =
      'https://' +
      this.chains[credentials.chain_id]['0x_param'] +
      'api.0x.org/swap/v1/price' +
      query;

    this.api_keys_0x_index++;

    if (this.api_keys_0x_index >= this.api_keys_0x.length) {
      this.api_keys_0x_index = 0;
    }
    const api_key_0x: string = this.api_keys_0x[this.api_keys_0x_index];

    const res: any = await axios.get(url, {
      headers: { '0x-api-key': api_key_0x },
    });

    return res.data;
  }

  async seed_sales_create(credentials: any): Promise<any> {
    await this.validator.seed_sales_create(credentials);

    const doc = UTILS_SERVICES.create_seed_sale_doc(credentials, this.options);
    const result = await this.options.db.seed_sales.insertOne(doc);

    return {
      ...doc,
      _id: result.insertedId,
    };
  }

  async seed_sales_get(credentials: any): Promise<any> {
    await this.validator.seed_sales_get(credentials);

    const $or = [];

    if (credentials.from) {
      $or.push({ from: credentials.from.toLowerCase() });
    }

    if (credentials.hash) {
      $or.push({ hash: credentials.hash.toLowerCase() });
    }

    const search: any = {};

    if ($or.length) {
      search.$or = $or;
    }

    const seed_sales = await this.options.db.seed_sales.find(search).toArray();

    return seed_sales;
  }

  async seed_sales_edit(credentials: any): Promise<any> {
    await this.validator.seed_sales_edit(credentials);

    await this.options.db.seed_sales.updateOne(
      { _id: new ObjectId(credentials._id) },
      {
        $set: {
          fulfilled: credentials.fulfilled,
        },
      }
    );

    return true;
  }
}

export default service_blockchain_init;
