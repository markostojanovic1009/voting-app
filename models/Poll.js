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
 *
 *  ---------------------------------------------------------------------------------
 *
 *
 * Vote Schema:
 *  - id,
 *  - user_id REFERENCES User.id - Indicates that the user voted for this poll option ( if he's logged in ),
 *  - poll_option_id REFERENCES PollOption.id - Indicates which poll option the user voted for
 *  - ip_address VARCHAR(255) - Indicates the ip_address of the user who voted. Used for non-registered voters
 *                              to prevent them from voting more than once.
 *
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
    },

    voteFor(poll_option_id, user_id, ip_address) {
        return new Promise((resolve, reject) => {

            knex.select('user_id', 'ip_address').from('votes').where(function() {
                this.where('user_id', user_id).orWhere('ip_address', ip_address);
            }).andWhere('poll_option_id', poll_option_id)
                .then((userVotes) => {
                    if (userVotes.length > 0) {
                        throw {
                            type: 'VOTED'
                        }
                    }
                    return knex('votes').insert({poll_option_id, user_id, ip_address});
                })
                .then(() => {
                    resolve({poll_option_id, user_id, ip_address});
                })
                .catch((error) => {
                    if(error.type === 'VOTED')
                        reject({msg: 'You cannot vote more than once.'});
                    else if(error.code === '23503') {
                        if(error.constraint === 'votes_user_id_foreign') {
                            reject({msg: 'Wrong user id.'});
                        } else if (error.constraint === 'votes_poll_option_id_foreign') {
                            reject({msg: 'Wrong poll option id.'});
                        }
                    }
                    else
                        reject(genericMessage);
                });

        });
    },

    getPollVotes(poll_id) {
        return new Promise((resolve, reject) => {

            knex.select('poll_option_id', 'text').count('poll_option_id').from(function() {
                this.select('id', 'text').from('poll_options').where('poll_id', poll_id).as('options')
                })
                .innerJoin('votes', 'votes.poll_option_id', 'options.id')
                .groupBy('poll_option_id', 'options.text')
                .then((result) => {
                    resolve(result.map( (item) => { return {...item, count: parseInt(item.count)}; }));
                })
                .catch((error) => {
                    reject(error);
                });

        });
    }

};

export default Poll;