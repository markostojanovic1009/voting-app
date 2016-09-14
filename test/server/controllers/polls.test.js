const knex = require('../../../config/database');
const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcryptjs');
const request = require('supertest-as-promised');
const server = require('../../../server');
const moment = require('moment');
const jwt = require('jsonwebtoken');

chai.use(require('chai-as-promised'));

describe('Poll controller', () => {

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

    // See /seeds/test/initial.js for database seeding.
    const numberOfUsers = 1;
    const numberOfPolls = 20;
    const numberOfOptionsPerPoll = 3;
    const numberOfVotes = 100;

    // See models/Poll.js -> Poll.getPolls()
    const numberOfPollsPerPage = 10;

    function generateToken(userId) {
        var payload = {
            iss: 'my.domain.com',
            sub: userId,
            iat: moment().unix(),
            exp: moment().add(7, 'days').unix()
        };
        return jwt.sign(payload, process.env.TOKEN_SECRET);
    }

    const loginUser = () => {
        return new Promise((resolve, reject) => {
            resolve(generateToken(genericUser.id));
        });
    };


    /*
     * It seems a lot of my tests for these routes
     * had the same structure, so I put it in a separate
     * function.
     * It receives a requestType as string('get', 'post', 'put', or 'delete')
     * and sends the request to the requested route.
     * If body is not needed it defaults to null.
     * If we need to send the authorization token, pass true as authorization parameter.
     */
    const generateRequest = (requestType, route, body = null, authorization = false) => {
        return loginUser().then((token) => {
            switch (requestType.toUpperCase()) {
                case 'GET': {
                    if (authorization)
                        return request(server)
                            .get(route)
                            .set('Authorization', `Bearer ${token}`)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                    else
                        return request(server)
                            .get(route)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                }

                case "POST": {
                    if (authorization)
                        return request(server)
                            .post(route)
                            .set('Authorization', `Bearer ${token}`)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                    else
                        return request(server)
                            .post(route)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                }

                case "PUT": {
                    if (authorization)
                        return request(server)
                            .put(route)
                            .set('Authorization', `Bearer ${token}`)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                    else
                        return request(server)
                            .put(route)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                }

                case "DELETE": {
                    if (authorization)
                        return request(server)
                            .del(route)
                            .set('Authorization', `Bearer ${token}`)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                    else
                        return request(server)
                            .del(route)
                            .send(body)
                            .then((res) => {
                                return res.body;
                            });
                }

                default:
                    return null;

            }
        });

    };

    describe('GET /api/polls', () => {

        it('should return all polls from the first page', ()=> {
            return generateRequest('GET', '/api/polls').then((response) => {
                return expect(response).to.have.lengthOf(numberOfPollsPerPage) &&
                    expect(response[0]).to.have.property('pollId', numberOfPolls)  &&
                    expect(response[9]).to.have.property('pollId', numberOfPolls - numberOfPollsPerPage + 1);
            });
        });

        it('should return a number of pages if page_count query parameter is sent', () => {

            return generateRequest('GET', '/api/polls?page_count=true').then((response) => {
                return expect(response.pageCount).to.be.equal(numberOfPolls / numberOfPollsPerPage);
            });

        });

        it('should return the appropriate page if page query parameter is passed', () => {

            return generateRequest('GET', '/api/polls?page=2').then((response) => {
                return expect(response).to.have.lengthOf(numberOfPolls - numberOfPollsPerPage) &&
                    expect(response[0]).to.have.property('pollId', numberOfPolls - numberOfPollsPerPage)  &&
                    expect(response[9]).to.have.property('pollId', numberOfPolls - 2 * numberOfPollsPerPage + 1);
            });

        });

        it('should return an empty array if page query parameter is greater than the total number of pages', () => {

            return expect(
                generateRequest('GET', '/api/polls?page=4')
            ).to.eventually.deep.equal([]);

        });

    });

    describe('POST /api/polls', ()=> {

        it('should create a new poll', () => {

            return expect(
                generateRequest('POST', '/api/polls', {
                    user_id: genericUser.id,
                    title: "New Poll",
                    options: [{
                        text: 'New option 1'
                    }, {
                        text: 'New option 2'
                    }]
                }, true).then(() => {
                    return knex.count('id').from('polls');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.deep.equal(numberOfPolls + 1);

        });

        it('should return an error if user_id is wrong', () => {
            return expect(
                generateRequest('POST', '/api/polls', {
                    user_id: 10000,
                    title: "New poll",
                    options: [{
                        text: 'New option 1'
                    }, {
                        text: 'New option 2'
                    }]
                }, true)
            ).to.be.eventually.deep.equal({msg: 'Wrong user id.'});
        });

        it('should return an error if empty title is sent', () => {
            return expect(
                generateRequest('POST', '/api/polls', {
                    user_id: genericUser.id,
                    title: "",
                    options: [{
                        text: 'New option 1'
                    }, {
                        text: 'New option 2'
                    }]
                }, true)
            ).to.be.eventually.deep.equal({msg: 'Title cannot be empty.'});
        });

        it('should return an error if any of the options are empty', () => {
            return expect(
                generateRequest('POST', '/api/polls', {
                    user_id: genericUser.id,
                    title: "New Title",
                    options: [{
                        text: ''
                    }, {
                        text: 'New option 2'
                    }]
                }, true)
            ).to.be.eventually.deep.equal({msg: 'An option cannot be empty.'});
        });

        it('should return an error if no options are valid', () => {
            return expect(
                generateRequest('POST', '/api/polls', {
                    user_id: genericUser.id,
                    title: "New Title",
                    options: []
                }, true)
            ).to.be.eventually.deep.equal({msg: 'At least one option must be valid.'});
        });

    });

    describe('GET /api/poll/:poll_id', () => {

        it('should return poll information', () => {
            const pollId = 1;
            return generateRequest('GET', `/api/poll/${pollId}`).then(([response]) => {

                return expect(response).to.have.property('id', pollId) &&
                    expect(response).to.have.property('owner_id', genericUser.id) &&
                    expect(response).to.have.property('title', `Poll Number ${pollId}`) &&
                    expect(response.options).to.have.lengthOf(numberOfOptionsPerPoll) &&
                    expect(response.options.reduce((prev, option) => {
                        return prev + option.count
                    }, 0)).to.equal(response.total);

            });

        });

        it('should return an error if poll id is nonexistent', () => {
            return expect(
                generateRequest('GET', `/api/poll/${numberOfPolls + 10}`)
            ).to.eventually.deep.equal({ msg: 'Wrong poll id' });
        });

    });

    describe('POST /api/poll/:poll_id', () => {

        it('should vote for an option when the user is unregistered', () => {

            const pollId = numberOfPolls + 1;
            const poll_option_id = numberOfPolls * numberOfOptionsPerPoll + 1;
            return expect(
                knex('polls').insert({user_id: genericUser.id, title: 'New Poll'}).then(() => {
                    return knex('poll_options').insert({poll_id: pollId, text: 'Poll Option 1'});
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id
                    });
                }).then(() => {
                    return knex.count('poll_option_id').from('votes').where({poll_option_id});
                }).then(([res]) => {
                    return parseInt(res.count);
                })
            ).to.eventually.equal(1);

        });

        it('should vote for an option when the user is registered', () => {

            const pollId = numberOfPolls + 1;
            const poll_option_id = numberOfPolls * numberOfOptionsPerPoll + 1;
            return expect(
                knex('polls').insert({user_id: genericUser.id, title: 'New Poll'}).then(() => {
                    return knex('poll_options').insert({poll_id: pollId, text: 'Poll Option 1'});
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id,
                        user_id: genericUser.id
                    });
                }).then(() => {
                    return knex.count('poll_option_id').from('votes').where({poll_option_id, user_id: genericUser.id});
                }).then(([res]) => {
                    return parseInt(res.count);
                })
            ).to.eventually.equal(1);

        });

        it('should return an error if a registered user attempts to vote twice', () => {

            const pollId = numberOfPolls + 1;
            const firstPollOptionId = numberOfPolls * numberOfOptionsPerPoll + 1;
            const secondPollOptionId = firstPollOptionId + 1;
            return expect(
                knex('polls').insert({user_id: genericUser.id, title: 'New Poll'}).then(() => {
                    return knex('poll_options').insert([{poll_id: pollId, text: 'Poll Option 1'}, {poll_id: pollId,
                        text: 'Poll option 2'}]);
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id: firstPollOptionId,
                        user_id: genericUser.id
                    });
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id: secondPollOptionId,
                        user_id: genericUser.id
                    });
                })
            ).to.eventually.deep.equal({msg: 'You cannot vote more than once.'});

        });

        it('should return an error if an unregistered user attempts to vote twice', () => {

            const pollId = numberOfPolls + 1;
            const firstPollOptionId = numberOfPolls * numberOfOptionsPerPoll + 1;
            const secondPollOptionId = firstPollOptionId + 1;
            return expect(
                knex('polls').insert({user_id: genericUser.id, title: 'New Poll'}).then(() => {
                    return knex('poll_options').insert([{poll_id: pollId, text: 'Poll Option 1'}, {poll_id: pollId,
                        text: 'Poll option 2'}]);
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id: firstPollOptionId,
                    });
                }).then(() => {
                    return generateRequest('POST', `/api/poll/${pollId}`, {
                        poll_option_id: secondPollOptionId,
                    });
                })
            ).to.eventually.deep.equal({msg: 'You cannot vote more than once.'});

        });

    });

    describe('PUT /api/poll/:poll_id', () => {

        it('should update the poll if the user is the poll owner', () => {

            const pollId = 1;
            generateRequest('PUT', `/api/poll/${pollId}`, {
                options: [{
                    text: 'New option'
                }]
            }, true).then(() => {
                return knex.select('id').from('poll_options').where('poll_id', pollId).orderBy('id', 'desc');
            }).then((result) => {
                return expect(result).to.have.lengthOf(numberOfOptionsPerPoll + 1) &&
                    expect(result[numberOfOptionsPerPoll]).to.have.property('id', numberOfOptionsPerPoll * numberOfPolls + 1);
            });

        });

        it('should return an error if an authenticated user tries to modify a poll that is not his', () => {
            return expect(
                knex('users').insert({name: 'Test', email: 'test@test.com', password: 'password'}).then(() => {
                    return knex('polls').insert({user_id: numberOfUsers + 1, title: 'New poll'});
                }).then(() => {
                    return knex('poll_options').insert([{poll_id: numberOfPolls + 1, text: 'Poll option 1'},
                        {poll_id: numberOfPolls + 1, text: 'Poll option 2'}]);
                }).then(() => {
                    return generateRequest('PUT', `/api/poll/${numberOfPolls + 1}`, {
                        options: [{
                            text: 'More text'
                        }]
                    }, true);
                })
            ).to.eventually.deep.equal({msg: 'Unauthorized.'});
        });

        it('should return an error if options array has no elements', () => {

            const pollId = 1;
            return expect(
                generateRequest('PUT', `/api/poll/${pollId}`, {
                    options: []
                }, true)
            ).to.eventually.deep.equal({msg: 'Include at least one option.'});
        });

        it('should return an error if an option is empty', () => {

            const pollId = 1;
            return expect(
                generateRequest('PUT', `/api/poll/${pollId}`, {
                    options: [{
                        text: "Good option 1"
                    }, {
                        text: '   '
                    }]
                }, true)
            ).to.eventually.deep.equal({msg: 'An option cannot empty.'});
        });

    });


    describe('DELETE /api/poll/:poll_id', () => {

        it('should delete a poll', () => {

            return expect(
                generateRequest('DELETE', `/api/poll/1`, null, true).then(() => {
                    return knex.count('id').from('polls').where('id', 1);
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.be.equal(0);

        });

        it('should delete all options that belong to that poll', () => {

            return expect(
                generateRequest('DELETE', `/api/poll/1`, null, true).then(() => {
                    return knex.count('id').from('poll_options').where('poll_id', 1);
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.be.equal(0);

        });

        it('should delete all votes that belong to that poll', () => {

            return expect(
                generateRequest('DELETE', `/api/poll/1`, null, true).then(() => {
                    return knex.count('id').from('votes');
                }).then(([result]) => {
                    return parseInt(result.count);
                })
            ).to.eventually.be.below(numberOfVotes);

        });

    })



});