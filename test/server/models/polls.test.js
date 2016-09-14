const knex = require('../../../config/database');
const chai = require('chai');
const bcrypt = require('bcryptjs');
const expect = chai.expect;

import Poll from '../../../models/Poll';

chai.use(require('chai-as-promised'));

describe('Poll Model', () => {

    beforeEach((done) => {
        knex.migrate.latest()
            .then(() => {
                return knex.seed.run();
            }).then(() => {
            done();
        }).catch((error) => {
            console.log("Database setup error: ", error);
            done();
        });
    });

    afterEach((done) => {
        knex.migrate.rollback().then(() => {
            done();
        }).catch((error) => {
            console.log("Database cleanup error: ", error);
        });
    });

    /*
     * genericUser should remain immutable.
     */
    const genericUser = {
        email: 'email@email.com',
        password: 'password',
        name: 'John Doe',
        gender: 'Male',
        picture: 'http://imgur.com/slfje3',
        location: 'San Francisco, California, USA',
        website: 'http://imaginarywebsite.com/',
        facebook: 'http://facebook.com/johndoe',
        google: 'http://plus.google.com/johndoe',
        twitter: 'http://twitter.com/johndoe',
        github: 'http://github.com/johndoe',
        id: 1
    };

    const numberOfUsers = 1;
    const numberOfPolls = 20;
    const numberOfOptionsPerPoll = 3;
    const numberOfVotes = 100;

    const createPoll = () => {
        return knex('polls').insert({user_id: genericUser.id, title: 'New poll.'}).returning(['id', 'user_id', 'title']);
    };

    const createPollWithOptions = () => {
        return createPoll().then(([poll]) => {
            return knex('poll_options').insert([
                {poll_id: poll.id, text: 'Poll Option 1'},
                {poll_id: poll.id, text: 'Poll Option 2'}
            ]).returning(['id']);
        });
    };

    describe('createPoll', () => {

        it('should create a new poll', () => {
            const newPollTitle = 'New poll';
            return expect(
                Poll.createPoll(genericUser.id, newPollTitle).then(() => {
                    return knex.select('title').from('polls').where('title', newPollTitle);
                }).then(([poll]) => {
                    return poll;
                })
            ).to.eventually.deep.equal({title: newPollTitle});

        });

        it('should return an error if nonexistent user id is sent', () => {

            return expect(
                Poll.createPoll(5, 'New title')
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong user id.'});
        });

    });

    describe('getPolls', () => {

        it('should return all existing polls with at least one option', () => {
            return expect(
                Poll.getPolls()
            ).to.eventually.have.lengthOf(10);
        });

        it('should not return polls with 0 options', () => {
            return expect(
                knex('polls').insert([{user_id: genericUser.id, title: "Poll 1"}, {user_id: genericUser.id, title: "Poll 2"}])
                    .then(() => {
                        return Poll.getPolls();
                    })
            ).to.eventually.have.lengthOf(8); // Two newest polls are invalid
        });

    });

    describe('addPollOptions', () => {

        it('should add new options to the poll', () => {
            const pollOptions = [{text: 'Poll option1'}, {text: 'Poll option2'}];
            let poll_id = 1;
            return expect(
                createPoll().then(([poll]) => {
                    poll_id = poll.id;
                    return Poll.addPollOptions(poll.id, pollOptions);
                }).then(() => {
                    return knex.select('text').from('poll_options').where('poll_id', poll_id);
                })
            ).to.eventually.deep.equal(pollOptions);
        });

        it('should return an error if poll id is wrong', () => {
            return expect(
                Poll.addPollOptions(100, [{text: 'Poll Option 1'}])
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong poll id.'});
        });

        it('should return an error if second parameter is not an array', () => {
            return expect(
                Poll.addPollOptions(1, 'Not an array')
            ).to.be.rejected.and.eventually.deep.equal({ msg: 'Second argument must be an array.'});
        })

    });


    describe('voteFor', () => {

        it('should add a new vote', () => {
            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(1, pollOptionsIds[0].id, genericUser.id, '127.0.0.1');
                }).then(() => {
                    return knex('votes').count('poll_option_id');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.deep.equal(numberOfVotes + 1);
        });

        it('should return an error if user_id is wrong', () => {

            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(1, pollOptionsIds[0].id, 100, '127.0.0.1');
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong user id.'});

        });

        it('should return an error if poll_option_id is wrong', () => {

            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(1, 100, genericUser.id, '127.0.0.1');
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong poll option id.'});

        });

        it('should return an error if a registered user tries to vote twice', () => {

            let pollOptions;
            return expect(
                createPollWithOptions().then((pollOptionIds) => {
                    pollOptions = pollOptionIds;
                    return Poll.voteFor(numberOfPolls + 1, pollOptionIds[0].id, genericUser.id, null);
                }).then(() => {
                    return Poll.voteFor(numberOfPolls + 1, pollOptions[1].id, genericUser.id, null);
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: "You cannot vote more than once."});

        });

        it('should return an error if an unregistered user tries to vote twice', () => {

            let pollOptions;
            return expect(
                createPollWithOptions().then((pollOptionIds) => {
                    pollOptions = pollOptionIds;
                    return Poll.voteFor(numberOfPolls + 1, pollOptionIds[0].id, null, '127.0.0.1');
                }).then(() => {
                    return Poll.voteFor(numberOfPolls + 1, pollOptions[1].id, null, '127.0.0.1');
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: "You cannot vote more than once."});

        });
    });

    describe('getPollVotes', () => {

        it('should return the right number of votes for each poll option', () => {

            return expect(
                    createPollWithOptions().then((pollOptionIds) => {
                        let ipAddress = '2714914';
                        let insertArray = [];
                        for(let i = 0; i < 10; i++ ) {
                            insertArray.push({
                                poll_option_id: pollOptionIds[i % 2].id,
                                user_id: null,
                                ip_address: ipAddress
                            });
                            ipAddress += i;
                        }
                        return knex('votes').insert(insertArray)
                    }).then(() => {
                        return Poll.getPollVotes(numberOfPolls + 1)
                    })
            ).to.eventually.deep.equal([
                {
                    id: numberOfPolls + 1,
                    options: [
                        {
                            count: 5,
                            poll_option_id: numberOfOptionsPerPoll * numberOfPolls + 1,
                            text: 'Poll Option 1'
                        },
                        {
                            count: 5,
                            poll_option_id: numberOfOptionsPerPoll * numberOfPolls + 2,
                            text: 'Poll Option 2'
                        }
                    ],
                    owner_id: 1,
                    title: 'New poll.',
                    total: 10
                }
            ]);

        });

        it('should return an error if poll id is wrong', () => {
            return expect(
                Poll.getPollVotes(100)
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong poll id'});
        });

    });

    describe('deletePoll', () => {

        it('should delete a poll from polls table', () => {

            return expect(
                createPollWithOptions().then(() => {
                    return Poll.deletePoll(1);
                }).then(() => {
                    return knex.select().from('polls').where('id', 1);
                })
            ).to.eventually.deep.equal([]);

        });

        it('should delete all poll options that belong to deleted poll', () => {

            return expect(
                createPollWithOptions().then(() => {
                    return Poll.deletePoll(1);
                }).then(() => {
                    return knex.select().from('poll_options').where('poll_id', 1);
                })
            ).to.eventually.deep.equal([]);

        });

        it('should delete all votes to deleted poll', () => {

            return expect(
                createPollWithOptions().then((pollOptionIds) => {
                    let ipAddress = '2714914';
                    let insertArray = [];
                    for (let i = 0; i < 10; i++) {
                        insertArray.push({
                            poll_option_id: pollOptionIds[i % 2].id,
                            user_id: null,
                            ip_address: ipAddress
                        });
                        ipAddress += i;
                    }
                    return knex('votes').insert(insertArray);
                }).then(() => {
                    return Poll.deletePoll(numberOfPolls + 1);
                }).then(() => {
                    return knex.select().from('votes');
                })
            ).to.eventually.have.lengthOf(numberOfVotes);

        })

    })

});