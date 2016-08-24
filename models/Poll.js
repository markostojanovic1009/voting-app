const knex = require('../config/database');
import User from './User';

const Poll = {

    createPoll(user_id, title) {
        return new Promise((resolve, reject) => {
            knex('polls').returning(['id', 'user_id', 'title']).insert({user_id, title})
                .then(([poll]) => {
                    resolve(poll);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

};