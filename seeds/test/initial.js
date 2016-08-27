const bcrypt = require('bcryptjs');

exports.seed = function(knex, Promise) {
    // Deletes ALL existing entries
    return Promise.all([
        knex('votes').del(),
        knex('poll_options').del(),
        knex('polls').del(),
        knex('users').del()
    ]);
};
