var config = require('../knexfile');
const environment = process.env.NODE_ENV || 'development';
console.log('Running on ', environment);
var knex = require('knex')(config[environment]);

module.exports = knex;
