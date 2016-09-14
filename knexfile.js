/**
 * knexfile.js
 * Initializes knex settings. See more at knexjs.org.
 */

// Loads environment variables, such as DB_HOST or DB_USER.
if(process.env.NODE_ENV !== 'production') {
  var dotenv = require('dotenv');
  dotenv.load();
}

// Add 'debug: true' to see SQL queries in console.
module.exports = {

  test: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_TEST_NAME
    },
    migrations: {
      directory: __dirname + '/migrations/test'
    },
    seeds: {
      directory: __dirname + '/seeds/test'
    }
  },

  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    },
    migrations: {
      directory: __dirname + '/migrations/development'
    },
    seeds: {
      directory: __dirname + '/seeds/development'
    }
  },

  // Production loads directly from database url
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: __dirname + '/migrations/production'
    },
    seeds: {
      directory: __dirname + '/seeds/production'
    }
  }

};
