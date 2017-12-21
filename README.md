
# *insight API*

*insight API* is an open-source onixcoin blockchain REST
and websocket API. Insight API runs in NodeJS and uses LevelDB for storage.

This is a backend-only service. If you're looking for the web frontend application,
take a look at https://github.com/onix-project/insight-onix-ui.

*Insight API* allows to develop onixcoin-related applications (such as wallets) that
require certain information from the blockchain that ONIXd does not provide.

A blockchain explorer front-end has been developed on top of *Insight API*. It can
be downloaded at [Github Insight Repository](https://github.com/onix-project/insight-onix-ui).

## Warning
  Insight file sync does not work with onixcoin
  In order to use Insigtht you must set the environment variable INSIGHT_FORCE_RPC_SYNC = 1  
  
## Prerequisites

* **ONIXd** - Download and Install [Onixcoin](https://github.com/onix-project/onixcoin)

*insight API* needs a *trusted* ONIXd node to run. *insight API* will connect to the node
through the RPC API, onixcoin peer-to-peer protocol, and will even read its raw block .dat files for syncing.

Configure ONIXd to listen to RPC calls and set `txindex` to true.
The easiest way to do this is by copying `./etc/onixd/onixcoin.conf` to your
onixcoin data directory (usually `~/.onixcoin` on Linux, `%appdata%\Onixcoin\` on Windows,
or `~/Library/Application Support/Onixcoin` on Mac OS X).

ONIXd must be running and must have finished downloading the blockchain **before** running *insight API*.


* **Node.js v0.10.x** - Download and Install [Node.js](http://www.nodejs.org/download/).

* **NPM** - Node.js package manager, should be automatically installed when you get node.js.


## Quick Install
  Check the Prerequisites section above before installing.

  To install Insight API, clone the main repository:

    $ git clone https://github.com/onix-project/insight-onix-api && cd insight-onix-api

  Install dependencies:

    $ npm install

  Run the main application:

    $ node insight.js

  Then open a browser and go to:

    http://localhost:3001

  Please note that the app will need to sync its internal database
  with the blockchain state, which may take some time. You can check
  sync progress at http://localhost:3001/api/sync.


## Configuration

All configuration is specified in the [config](config/) folder, particularly the [config.js](config/config.js) file. There you can specify your application name and database name. Certain configuration values are pulled from environment variables if they are defined:

```
BITCOIND_HOST         # RPC ONIXd host
BITCOIND_PORT         # RPC ONIXd Port
BITCOIND_P2P_HOST     # P2P ONIXd Host (will default to BITCOIND_HOST, if specified)
BITCOIND_P2P_PORT     # P2P ONIXd Port
BITCOIND_USER         # RPC username
BITCOIND_PASS         # RPC password
BITCOIND_DATADIR      # Onixd datadir. 'testnet' will be appended automatically if testnet is used. NEED to finish with '/'. e.g: `/vol/data/`
INSIGHT_NETWORK [= 'livenet' | 'testnet']
INSIGHT_PORT          # insight api port
INSIGHT_DB            # Path where to store insight's internal DB. (defaults to $HOME/.insight)
INSIGHT_SAFE_CONFIRMATIONS=6  # Nr. of confirmation needed to start caching transaction information
INSIGHT_IGNORE_CACHE  # True to ignore cache of spents in transaction, with more than INSIGHT_SAFE_CONFIRMATIONS confirmations. This is useful for tracking double spents for old transactions.
ENABLE_CURRENCYRATES # if "true" will enable a plugin to obtain historic conversion rates for various currencies
ENABLE_RATELIMITER # if "true" will enable the ratelimiter plugin
LOGGER_LEVEL # defaults to 'info', can be 'debug','verbose','error', etc.
ENABLE_HTTPS # if "true" it will server using SSL/HTTPS
ENABLE_EMAILSTORE # if "true" will enable a plugin to store data with a validated email address
INSIGHT_EMAIL_CONFIRM_HOST # Only meanfull if ENABLE_EMAILSTORE is enable. Hostname for the confirm URLs. E.g: 'https://www.onixcoin.info/'

```

Make sure that ONIXd is configured to [accept incoming connections using 'rpcallowip'](https://en.bitcoin.it/wiki/Running_Bitcoin).

In case the network is changed (testnet to livenet or vice versa) levelDB database needs to be deleted. This can be performed running:
```util/sync.js -D``` and waiting for *insight* to synchronize again.  Once the database is deleted, the sync.js process can be safely interrupted (CTRL+C) and continued from the synchronization process embedded in main app.

## Synchronization

The initial synchronization process scans the blockchain from the paired ONIXd server to update addresses and balances. *insight-onix-api* needs exactly one trusted ONIXd node to run. This node must have finished downloading the blockchain before running *insight-onix-api*.

While *insight* is synchronizing the website can be accessed (the sync process is embedded in the webserver), but there may be missing data or incorrect balances for addresses. The 'sync' status is shown at the `/api/sync` endpoint.

The blockchain can be read from ONIXd's raw `.dat` files or RPC interface.
Reading the information from the `.dat` files is much faster so it's the
recommended (and default) alternative. `.dat` files are scanned in the default
location for each platform (for example, `~/.onixcoin` on Linux). 

While synchronizing the blockchain, *insight-onix-api* listens for new blocks and
transactions relayed by the ONIXd node. Those are also stored on *insight-onix-api*'s database.
In case *insight-onix-api* is shutdown for a period of time, restarting it will trigger
a partial (historic) synchronization of the blockchain. Depending on the size of
that synchronization task, a reverse RPC or forward `.dat` syncing strategy will be used.

If ONIXd is shutdown, *insight-onix-api* needs to be stopped and restarted
once ONIXd is restarted.

### Syncing old blockchain data manually

  Old blockchain data can be manually synced issuing:

    $ util/sync.js

  Check util/sync.js --help for options, particulary -D to erase the current DB.

  *NOTE*: there is no need to run this manually since the historic synchronization
  is built in into the web application. Running *insight-onix-api* normally will trigger
  the historic sync automatically.


### DB storage requirement

To store the blockchain and address related information, *insight-onix-api* uses LevelDB.
Two DBs are created: txs and blocks. By default these are stored on

  ``~/.insight/``

Please note that some older versions of Insight-API store that on `<insight's root>/db`.

This can be changed at config/config.js. As of June 2014, storing the livenet blockchain takes ~35GB of disk space (2GB for the testnet).

## Development

To run insight locally for development with grunt:

```$ NODE_ENV=development grunt```

To run the tests

```$ grunt test```


Contributions and suggestions are welcome at [insight-onix-api github repository](https://github.com/onix-project/insight-onix-api).

## Caching schema

Since v0.2 a new cache schema has been introduced. Only information from transactions with
INSIGHT_SAFE_CONFIRMATIONS settings will be cached (by default SAFE_CONFIRMATIONS=6). There
are 3 different caches:
 * Number of confirmations
 * Transaction output spent/unspent status
 * scriptPubKey for unspent transactions

Cache data is only populated on request, i.e., only after accessing the required data for
the first time, the information is cached, there is not pre-caching procedure.  To ignore
cache by default, use INSIGHT_IGNORE_CACHE. Also, address related calls support `?noCache=1`
to ignore the cache in a particular API request.

## API

By default, insight provides a REST API at `/api`, but this prefix is configurable from the var `apiPrefix` in the `config.js` file.

The end-points are:


### Block
```
  /api/block/[:hash]
  /api/block/000007140b7a6ca0b64965824f5731f6e86daadf19eb299033530b1e61236e43
```
### Block index
Get block hash by height
```
  /api/block-index/[:height]
  /api/block-index/0
```
This would return:
```
{"blockHash":"000007140b7a6ca0b64965824f5731f6e86daadf19eb299033530b1e61236e43"}
```
which is the hash of the Genesis block (0 height)

### Transaction
```
  /api/tx/[:txid]
  /api/tx/eb621d683432b1d091ead286754bcc197405b1003dc25153f0a6b27c191807d5
  /api/raw/[:rawid]
  /api/raw/eb621d683432b1d091ead286754bcc197405b1003dc25153f0a6b27c191807d5
```
### Address
```
  /api/addr/[:addr][?noTxList=1&noCache=1]
  /api/addr/XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe?noTxList=1
```
### Address Properties
```
  /api/addr/[:addr]/balance
  /api/addr/[:addr]/totalReceived
  /api/addr/[:addr]/totalSent
  /api/addr/[:addr]/unconfirmedBalance
```
The response contains the value in Satoshis.
### Unspent Outputs
```
  /api/addr/[:addr]/utxo[?noCache=1]
```
Sample return:
``` json
[
    {
      "address": "XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe",
      "txid": "26d525467229c9202e5c4c9fd95900ae9b21aa07a4180573e2572a76fe1dbfbb",
      "vout": 0,
      "ts": 1513440846,
      "scriptPubKey": "76a914b466b6445243ce95d8e41878f4fc8e6bda5cddb488ac",
      "amount": 999.99,
      "confirmations": 1983,
      "confirmationsFromCache": false
    }
]
```
Please note that in case confirmations are cached (which happens by default when the number of confirmations is bigger that INSIGHT_SAFE_CONFIRMATIONS) the response will include the pair confirmationsFromCache:true, and confirmations will equal INSIGHT_SAFE_CONFIRMATIONS. See noCache and INSIGHT_IGNORE_CACHE options for details.



### Unspent Outputs for multiple addresses
GET method:
```
  /api/addrs/[:addrs]/utxo
  /api/addrs/XE24Mn4ekpGMyUZK7ubABmUf7ZASDtEwP6,XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe/utxo
```

POST method:
```
  /api/addrs/utxo
```

POST params:
```
addrs: XE24Mn4ekpGMyUZK7ubABmUf7ZASDtEwP6,XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe
```

### Transactions by Block
```
  /api/txs/?block=HASH
  /api/txs/?block=0000000000000f24465c1c4153f74bd1eb66ffd92bdaa43eb29745637dc8abc4
```
### Transactions by Address
```
  /api/txs/?address=ADDR
  /api/txs/?address=XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe
```

### Transactions for multiple addresses
GET method:
```
  /api/addrs/[:addrs]/txs[?from=&to=]
  /api/addrs/XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe,XE24Mn4ekpGMyUZK7ubABmUf7ZASDtEwP6/txs?from=0&to=20
```

POST method:
```
  /api/addrs/txs
```

POST params:
```
addrs: XTo7XEAgPapkgJkgH6iR31J4cHBxwTgREe,XE24Mn4ekpGMyUZK7ubABmUf7ZASDtEwP6
from (optional): 0
to (optional): 20
```

Sample output:
```
{ totalItems: 100,
  from: 0,
  to: 20,
  items:
    [ { txid: '26d525467229c9202e5c4c9fd95900ae9b21aa07a4180573e2572a76fe1dbfbb',
       version: 1,
       locktime: 0,
       vin: [Object],
       vout: [Object],
       blockhash: '00000000000007240dc03ec6c99b1cd8ef23ebd86dfbf68585f9414635c64cfa',
       confirmations: 1983,
       time: 1513440846,
       blocktime: 1513440846,
       valueOut: 999.99,
       size: 340,
       valueIn: 0.02,
       fees: 0.001},
      { ... },
      { ... },
      ...
      { ... }
    ]
 }
```

Note: if pagination params are not specified, the result is an array of transactions.


### Transaction broadcasting
POST method:
```
  /api/tx/send
```
POST params:
```
  rawtx: "signed transaction as hex string"

  eg

  rawtx: 01000000017b1eabe0209b1fe794124575ef807057c77ada2138ae4fa8d6c4de0398a14f3f00000000494830450221008949f0cb400094ad2b5eb399d59d01c14d73d8fe6e96df1a7150deb388ab8935022079656090d7f6bac4c9a94e0aad311a4268e082a725f8aeae0573fb12ff866a5f01ffffffff01f0ca052a010000001976a914cbc20a7664f2f69e5355aa427045bc15e7c6c77288ac00000000

```
POST response:
```
  {
      txid: [:txid]
  }

  eg

  {
      txid: "c7736a0a0046d5a8cc61c8c3c2821d4d7517f5de2bc66a966011aaa79965ffba"
  }
```

### Historic blockchain data sync status
```
  /api/sync
```

### Live network p2p data sync status
```
  /api/peer
```

### Status of the onixcoin network
```
  /api/status?q=xxx
```

Where "xxx" can be:

 * getInfo
 * getDifficulty
 * getTxOutSetInfo
 * getBestBlockHash
 * getLastBlockHash

## Web Socket API
The web socket API is served using [socket.io](http://socket.io).

The following are the events published by insight:

'tx': new transaction received from network. This event is published in the 'inv' room. Data will be a app/models/Transaction object.
Sample output:
```
{
  "txid":"00c1b1acb310b87085c7deaaeba478cef5dc9519fab87a4d943ecbb39bd5b053",
  "processed":false
  ...
}
```


'block': new block received from network. This event is published in the 'inv' room. Data will be a app/models/Block object.
Sample output:
```
{
  "hash":"000000004a3d187c430cd6a5e988aca3b19e1f1d1727a50dead6c8ac26899b96",
  "time":1389789343,
  ...
}
```

'<onixcoinAddress>': new transaction concerning <onixcoinAddress> received from network. This event is published in the '<onixcoinAddress>' room.

'status': every 1% increment on the sync task, this event will be triggered. This event is published in the 'sync' room.

Sample output:
```
{
  blocksToSync: 164141,
  syncedBlocks: 475,
  upToExisting: true,
  scanningBackward: true,
  isEndGenesis: true,
  end: "000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943",
  isStartGenesis: false,
  start: "000000009f929800556a8f3cfdbe57c187f2f679e351b12f7011bfc276c41b6d"
}
```

### Example Usage

The following html page connects to the socket.io insight API and listens for new transactions.

html
```
<html>
<body>
  <script src="http://<insight-server>:<port>/socket.io/socket.io.js"></script>
  <script>
    eventToListenTo = 'tx'
    room = 'inv'

    var socket = io("http://<insight-server>:<port>/");
    socket.on('connect', function() {
      // Join the room.
      socket.emit('subscribe', room);
    })
    socket.on(eventToListenTo, function(data) {
      console.log("New transaction received: " + data.txid)
    })
  </script>
</body>
</html>
```

## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
