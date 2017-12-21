var _ = require('lodash');

module.exports.id = 'CoinMarketCap';
module.exports.url = 'https://api.coinmarketcap.com/v1/ticker/onix/';

module.exports.parseFn = function(raw) {
  return [{
    code: 'USD',
    rate: parseFloat(JSON.parse(data)[0].price_usd)
  }];
};
