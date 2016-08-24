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
        })
    ]);
};

exports.down = function(knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('polls').dropTable('users')
    ]);
};
