exports.up = function(knex, Promise) {
    return Promise.all([
        knex.schema.createTable('users', function(table) {
            table.increments();
            table.string('name').notNullable();
            table.string('email').unique();
            table.string('password').notNullable();
            table.string('password_reset_token');
            table.dateTime('password_reset_expires');
            table.string('gender');
            table.string('location');
            table.string('website');
            table.string('picture');
            table.string('facebook');
            table.string('twitter');
            table.string('google');
            table.string('github');
            table.timestamps();
        }).createTable('polls', function(table) {
            table.increments();
            table.integer('user_id').references('id').inTable('users');
            table.string('title').notNullable();
        }).createTable('poll_options', function(table) {
            table.increments();
            table.string('text');
            table.integer('poll_id').references('id').inTable('polls');
        }).createTable('votes', function(table) {
            table.increments();
            table.integer('poll_option_id').references('id').inTable('poll_options');
            table.integer('user_id').references('id').inTable('users');
            table.string('ip_address');
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTableIfExists('votes')
            .dropTableIfExists('poll_options')
            .dropTableIfExists('polls')
            .dropTableIfExists('users')
    ]);
};
