const knex = require('../config/database');
import User from './User';

const genericMessage = {
    msg: 'An error occurred. Please try again later.'
};

const Poll = {

    createPoll(user_id, title) {
        return new Promise((resolve, reject) => {
            knex('polls').returning(['id', 'user_id', 'title']).insert({user_id, title})
                .then(([poll]) => {
                    resolve(poll);
                })
                .catch((error) => {
                    if(error.code === '23503')
                        reject({msg: 'Wrong user id.'});
                    else
                        reject(genericMessage);
                });
        });
    }

};

export default Poll;