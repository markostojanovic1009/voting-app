if(process.env.NODE_ENV !== 'production') {
  var dotenv = require('dotenv');
  dotenv.load();
}
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
