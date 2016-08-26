const bcrypt = require('bcryptjs');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
    return Promise.all([
        knex('votes').del(),
        knex('poll_options').del(),
        knex('polls').del(),
        knex('users').del()
    ])
    .then(function () {
        // Inserts seed entries
        return knex('users').insert([
            {email: 'test1@email.com', password: bcrypt.hashSync('password', bcrypt.genSaltSync(10)), name: 'Test User 1'},
            {email: 'test2@email.com', password: bcrypt.hashSync('password', bcrypt.genSaltSync(10)), name: 'Test User 2'},
            {email: 'test3@email.com', password: bcrypt.hashSync('password', bcrypt.genSaltSync(10)), name: 'Test User 3'}
        ]).returning('id');
    }).then((userIdArray) => {
        let pollArray = new Array(10);
        for(let i = 0; i < pollArray.length; i++) {
            pollArray[i] = {
                user_id: userIdArray[Math.floor(Math.random() * 3)].id,
                title: `Poll Number ${i + 1}`
            }
        }
        return knex('polls').insert(pollArray).returning('id');
    }).then((pollIdArray) => {
        let pollOptionsArray = new Array(Math.floor(Math.random() * 20 + 20));
        for(let i = 0; i < pollOptionsArray; i++ ) {
            const pollNumber = Math.floor(Math.random() * 10);
            pollOptionsArray[i] = {
                poll_id: pollIdArray[pollNumber].id,
                text: `Option number ${i + 1} from Poll Number ${pollNumber + 1}`
            }
        }
        return knex('poll_options').insert(pollOptionsArray);
    });
};
