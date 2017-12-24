var _ = require('lodash');

module.exports.id = 'Yobit';
module.exports.url = 'https://yobit.net/api/3/ticker/onx_btc';

module.exports.parseFn = function(raw) {
  return [{
    code: 'BTC',
    rate: parseFloat(JSON.parse(data.onx_btc.last))
  }];
};
