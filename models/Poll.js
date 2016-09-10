const knex = require('../config/database');

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

    /**
     * Creates a new poll with title and user_id.
     * Poll options can later be added by calling addPollOptions.
     */
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

    /**
     * Returns polls and aggregated poll results.
     * Receives either a valid user id, in which case it returns
     * polls made by the user with that id, or null, in which case
     * it returns all the polls.
     * It also supports pagination.
     */
    getPolls(user_id, pageNumber) {
        return new Promise((resolve, reject) => {

            knex.select('offset_polls.id as pollId', 'offset_polls.title', 'poll_options.id as pollOptionId', 'text', 'vote_count')
                .from(function() {
                    this.select("*")
                        .from('polls')
                        .where(user_id ? {user_id} : {}) // Filter based on user_id
                        .orderBy('id', 'desc')
                        .limit(10)
                        .offset(pageNumber > 0 ? (pageNumber - 1) * 10 : 0) // If invalid pageNumber is sent default to 0
                        .as('offset_polls')
                })
                .join('poll_options', 'poll_options.poll_id', 'offset_polls.id')
                .joinRaw('left outer join (SELECT poll_option_id, COUNT(poll_option_id) as vote_count ' +
                    'FROM votes GROUP BY poll_option_id ) as votesCount ' +
                    'ON poll_options.id = votesCount.poll_option_id')
                .orderBy('offset_polls.id', 'desc')// Newest polls first
                .then((result) => {
                    /*
                     * Groups results into an array of poll objects.
                     * Each poll object has a pollId, title, total ( added later )
                     * and options array.
                     * Options is an array of Poll Options Objects, each of which
                     * has a pollOptionId, text, vote_count and percentage (added later) property.
                     */

                    let groupedResults = [];
                    let lastInsertedIndex = -1;
                    for(let i = 0; i < result.length; i++ ) {
                        // If groupedResults is empty or if we encountered a new poll, we insert a new Poll Object.
                        if(lastInsertedIndex === -1 || groupedResults[lastInsertedIndex].pollId !== result[i].pollId) {
                            groupedResults.push({
                                pollId: result[i].pollId,
                                title: result[i].title,
                                options: result[i].pollOptionId ? [{
                                    pollOptionId: result[i].pollOptionId,
                                    text: result[i].text,
                                    vote_count: result[i].vote_count ? parseInt(result[i].vote_count) : 0
                                }] : []
                            });
                            lastInsertedIndex++;
                        } else {
                            // Otherwise we encountered a Poll Option that belongs to the Poll that was inserted already.
                            // Just insert the new Poll Option into the options array.
                            groupedResults[lastInsertedIndex].options.push({
                                pollOptionId: result[i].pollOptionId,
                                vote_count: result[i].vote_count ? parseInt(result[i].vote_count) : 0,
                                text: result[i].text
                            });
                        }
                    }

                    // Calculate the total number of votes for each Poll,
                    // and from that a percentage of votes for each Poll Option.
                    groupedResults = groupedResults.map((item) => {

                        const total = item.options.reduce((prev, current) => {
                            return prev + current.vote_count
                        }, 0);

                        /*
                         * Returns 0% for each option if nobody voted in this poll.
                         */
                        return {
                            ...item,
                            total,
                            options: item.options.map((option) => {
                                return {
                                    ...option,
                                    percentage: total > 0 ? (option.vote_count / total * 100).toFixed(2) : 0};
                            })
                        };
                    });
                    resolve(groupedResults);
                })
                .catch((error) => {
                    console.log(error);
                    reject(genericMessage);
                });

        });
    },

    /**
     * Adds additional options to the poll.
     * Used when creating the poll or when updating it.
     * pollOptions must be an array of objects with a single property 'text'.
     */
    addPollOptions(poll_id, pollOptions) {
        return new Promise((resolve, reject) => {

            if (!Array.isArray(pollOptions))
                reject({ msg: 'Second argument must be an array.'});

            // Add a poll_id foreign key to each poll option
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

    /**
     * Inserts a new vote into the vote table.
     * Checks whether the user voted ( checks for user_id if he is registered and logged in,
     * otherwise checks for ip address ) to disallow voting multiple times.
     */
    voteFor(poll_id, poll_option_id, user_id, ip_address) {
        return new Promise((resolve, reject) => {

            knex.select('user_id', 'ip_address').from(function() {

                this.select('id as poll_option_id').from('poll_options').where('poll_id', poll_id).as('options');

            }).innerJoin('votes', 'votes.poll_option_id', 'options.poll_option_id')
                .where(function() {

                    this.where(function() {
                        this.whereNotNull('user_id').andWhere('user_id', user_id);
                    }).orWhere('ip_address', ip_address);

                })
                .then((userVotes) => {
                    // Found either user_id or ip_address that was already
                    // used to vote in this poll.
                    if (userVotes.length > 0) {
                        throw {
                            type: 'VOTED'
                        }
                    }

                    // Otherwise insert the new vote
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

    /**
     * Returns poll title, poll options and aggregated poll results.
     */
    getPollVotes(poll_id) {
        return new Promise((resolve, reject) => {
            let options = [];
            let owner_id = null;

            //Find the owner of the poll first
            knex.select('user_id').from('polls').where('id', poll_id).then(([result]) => {

                // Throw an error if poll_id isn't found
                if(!result) {
                    throw {
                        type: 'INVALID_POLL_ID'
                    }
                }
                owner_id = result.user_id;

                // Find all poll options and their votes
                return knex.select('options.id as poll_option_id', 'text').count('poll_option_id').from(function () {
                    this.select('id', 'text').from('poll_options').where('poll_id', poll_id).as('options')
                })
                    .leftOuterJoin('votes', 'votes.poll_option_id', 'options.id')
                    .groupBy('options.id', 'options.text');
            }).then((result) => {

                // Count is returned as a string initially - I guess that's knex behavior -
                // so I parse them all for future calculations
                options = result.map((item) => {
                    return {...item, count: parseInt(item.count)};
                });

                // Finally get poll's title
                return knex.select('id', 'title').from('polls').where('id', poll_id);

            }).then(([poll]) => {

                const total = options.reduce((previous, item) => {
                    return previous + item.count;
                }, 0);

                resolve([{
                    ...poll,
                    total,
                    options,
                    owner_id
                }]);

            }).catch((error) => {

                if(error.type === 'INVALID_POLL_ID')
                    reject({
                        msg: 'Wrong poll id'
                    });

                reject(genericMessage);
            });
        });
    },

    getPollOwner(poll_id) {
        return new Promise((resolve, reject) => {
            knex.select('user_id').from('polls').where('id', poll_id).then(([result]) => {
                resolve(result.user_id);
            }).catch((error) => {
                if(error.code === '23503')
                    reject({msg: 'Wrong poll id.'});
                else
                    reject(genericMessage);
            })
        })
    },

    /**
     * Delete a poll with a given id
     */
    deletePoll(poll_id) {
        return new Promise((resolve, reject) => {
            return knex('polls').where('id', poll_id).del().then(() => {
                resolve();
            }).catch((error) => {
                reject(genericMessage);
            });
        });
    }

};

export default Poll;