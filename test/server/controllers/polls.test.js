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
        github: 'http://github.com/johndoe'
    };

    const createUser = () => {
        return knex('users')
            .insert({ ...genericUser, password: bcrypt.hashSync(genericUser.password, bcrypt.genSaltSync(10))});
    };

    function generateToken(userId) {
        var payload = {
            iss: 'my.domain.com',
            sub: userId,
            iat: moment().unix(),
            exp: moment().add(7, 'days').unix()
        };
        return jwt.sign(payload, process.env.TOKEN_SECRET);
    }

    const createAndLoginUser = () => {
        return createUser().returning('id').then((id) => {
            return generateToken(parseInt(id));
        })
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
    const generateRequest = (requestType, route, body, authorization) => {
        return createAndLoginUser().then((token) => {
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

        it('should return all polls', () => {

            return expect(
                generateRequest('GET', '/api/polls', null, false)
            ).to.eventually.have.lengthOf(10);

        });

    });
});