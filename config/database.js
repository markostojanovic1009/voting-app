var config = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
var knex = require('knex')(config[environment]);

module.exports = knex;
