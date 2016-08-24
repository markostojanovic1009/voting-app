const knex = require('../config/database');
import User from './User';

const genericMessage = {
    msg: 'An error occurred. Please try again later.'
};


/**
 * Poll Schema:
 *  - id
 *  - title VARCHAR(255),
 *  - user_id FOREIGN KEY REFERENCES User.id - Indicates which user created the poll.
 *
 *  ---------------------------------------------------------------------------------
 *
 *  PollOption Schema:
 *  - id
 *  - text VARCHAR(255),
 *  - poll_id FOREIGN KEY REFERENCES Poll.id - Indicates which poll this option belongs to.
 */
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
    },

    addPollOptions(poll_id, pollOptions) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(pollOptions))
                reject({ msg: 'Second argument must be an array.'});
            const mappedOptions = pollOptions.map((item) => { return {...item, poll_id }; });
            knex('poll_options').insert(mappedOptions).returning(['id', 'poll_id', 'text'])
                .then((pollOptions) => {
                    resolve(pollOptions);
                })
                .catch((error) => {
                    if(error.code === '23503')
                        reject({msg: 'Wrong poll id.'});
                    else
                        reject(genericMessage);
                });
        });
    }

};

export default Poll;