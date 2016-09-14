const bcrypt = require('bcryptjs');

exports.seed = function(knex, Promise) {
    // Deletes ALL existing entries
    return Promise.all([
        knex('votes').del(),
        knex('poll_options').del(),
        knex('polls').del(),
        knex('users').del()
    ]).then(function () {
            // Inserts seed entries
            return knex('users').insert([{
                    email: 'email@email.com',
                    password: bcrypt.hashSync('password', bcrypt.genSaltSync(10)),
                    name: 'John Doe',
                    gender: 'Male',
                    picture: 'http://imgur.com/slfje3',
                    location: 'San Francisco, California, USA',
                    website: 'http://imaginarywebsite.com/',
                    facebook: 'http://facebook.com/johndoe',
                    google: 'http://plus.google.com/johndoe',
                    twitter: 'http://twitter.com/johndoe',
                    github: 'http://github.com/johndoe'
                }]).returning('id');
        }).then((userIdArray) => {
            let pollArray = new Array(userIdArray.length * 20);
            for(let i = 0; i < pollArray.length; i++) {
                pollArray[i] = {
                    user_id: userIdArray[i % pollArray.length],
                    title: `Poll Number ${i + 1}`
                }
            }
            return knex('polls').insert(pollArray).returning('id');
        }).then((pollIdArray) => {
            let pollOptionsArray = new Array(pollIdArray.length * 3);
            for(let i = 0; i < pollOptionsArray.length; i++ ) {
                const pollNumber = i % pollIdArray.length;
                pollOptionsArray[i] = {
                    poll_id: pollIdArray[pollNumber],
                    text: `Option number ${i + 1} from Poll Number ${pollNumber + 1}`
                }
            }
            return knex('poll_options').insert(pollOptionsArray).returning('id');
        }).then((pollOptionsIds) => {
            let votesArray = new Array(100);
            for(let i = 0; i < votesArray.length; i++) {
                votesArray[i] = {
                    poll_option_id: pollOptionsIds[Math.floor(Math.random() * pollOptionsIds.length)],
                    user_id: null,
                    ip_address: i.toString()
                }
            }
            return knex('votes').insert(votesArray);
        });
};
