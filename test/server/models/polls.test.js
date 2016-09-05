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
        github: 'http://github.com/johndoe'
    };

    const createUser = () => {
        return knex('users')
            .insert({ ...genericUser, password: bcrypt.hashSync(genericUser.password, bcrypt.genSaltSync(10))});
    };

    describe('createPoll', () => {

        it('should create a new poll', () => {

            return expect(
                createUser().then(() => {
                    return Poll.createPoll(1, 'New poll');
                }).then(() => {
                    return knex.select('title').from('polls');
                }).then(([poll]) => {
                    return poll;
                })
            ).to.eventually.deep.equal({title: 'New poll'});

        });

        it('should return an error if nonexistent user id is sent', () => {

            return expect(
                Poll.createPoll(5, 'New title')
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong user id.'});
        });

    });

    const createPoll = () => {
      return createUser().then(() => {
          return knex('polls').insert({user_id: 1, title: 'New poll.'}).returning(['id', 'user_id', 'title']);
      });
    };

    describe('getPolls', () => {

        it('should return all existing polls with at least one option', () => {
            return expect(
                createUser().then(() => {
                    return knex('polls').insert([{user_id: 1, title: "Poll 1"}, {user_id: 1, title: "Poll 2"}]);
                }).then(() => {
                    return knex('poll_options').insert([{poll_id: 1, text: 'Option 1'}, {poll_id: 2, text: 'Option 2'}]);
                }).then(() => {
                    return Poll.getPolls();
                })
            ).to.eventually.have.lengthOf(2);
        });

        it('should not return polls with 0 options', () => {
            return expect(
                createUser().then(() => {
                    return knex('polls').insert([{user_id: 1, title: "Poll 1"}, {user_id: 1, title: "Poll 2"}]);
                }).then(() => {
                    return Poll.getPolls();
                })
            ).to.eventually.have.lengthOf(0);
        });

    });

    describe('addPollOptions', () => {

        it('should add new options to the poll', () => {
            const pollOptions = [{text: 'Poll option1'}, {text: 'Poll option2'}];
            return expect(
                createPoll().then(([poll]) => {
                    return Poll.addPollOptions(poll.id, pollOptions);
                }).then(() => {
                    return knex.select('text').from('poll_options');
                })
            ).to.eventually.deep.equal(pollOptions);
        });

        it('should return an error if poll id is wrong', () => {
            return expect(
                Poll.addPollOptions(5, [{text: 'Poll Option 1'}])
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong poll id.'});
        });

        it('should return an error if second parameter is not an array', () => {
            return expect(
                Poll.addPollOptions(5, 'Not an array')
            ).to.be.rejected.and.eventually.deep.equal({ msg: 'Second argument must be an array.'});
        })

    });

    const createPollWithOptions = () => {
        return createPoll().then(([poll]) => {
            return knex('poll_options').insert([
                {poll_id: poll.id, text: 'Poll Option 1'},
                {poll_id: poll.id, text: 'Poll Option 2'}
                ]).returning(['id']);
        });
    };
    describe('voteFor', () => {
        it('should add a new vote', () => {
            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(pollOptionsIds[0].id, 1, '127.0.0.1');
                }).then(() => {
                    return knex('votes').count('poll_option_id');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.deep.equal(1);
        });

        it('should return an error if user_id is wrong', () => {

            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(pollOptionsIds[0].id, 100, '127.0.0.1');
                }).then(() => {
                    return knex('votes').count('poll_option_id');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong user id.'});

        });

        it('should return an error if poll_id is wrong', () => {

            return expect(
                createPollWithOptions().then((pollOptionsIds) => {
                    return Poll.voteFor(100, 1, '127.0.0.1');
                }).then(() => {
                    return knex('votes').count('poll_option_id');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Wrong poll option id.'});

        });

        it('should return an error if a registered user tries to vote twice', () => {

            let pollOptions;
            return expect(
                createPollWithOptions().then((pollOptionIds) => {
                    pollOptions = pollOptionIds;
                    return Poll.voteFor(pollOptionIds[0].id, 1, null);
                }).then(() => {
                    return Poll.voteFor(pollOptions[0].id, 1, null);
                })
            ).to.be.rejected.and.eventually.deep.equal({msg: "You cannot vote more than once."});

        });

        it('should return an error if an unregistered user tries to vote twice', () => {

            let pollOptions;
            return expect(
                createPollWithOptions().then((pollOptionIds) => {
                    pollOptions = pollOptionIds;
                    return Poll.voteFor(pollOptionIds[0].id, null, '127.0.0.1');
                }).then(() => {
                    return Poll.voteFor(pollOptions[0].id, null, '127.0.0.1');
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
                        return Poll.getPollVotes(1)
                    })
            ).to.eventually.deep.equal([
                {text: 'Poll Option 1', poll_option_id: 1, count: 5},
                {text: 'Poll Option 2', poll_option_id: 2, count: 5}
            ]);
        });

        it('should return an empty array if poll id is wrong', () => {
            return expect(
                Poll.getPollVotes(100)
            ).to.eventually.deep.equal([]);
        });

    });

});