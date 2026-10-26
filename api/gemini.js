// Alias endpoint pointing to api/tarot.js
const tarotHandler = require('./tarot.js');

module.exports = async function handler(req, res) {
  return tarotHandler(req, res);
};
