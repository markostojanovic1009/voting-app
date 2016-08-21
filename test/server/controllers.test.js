const knex = require('../../config/database');
const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcryptjs');
const request = require('supertest-as-promised');
const server = require('../../server');
const moment = require('moment');
const jwt = require('jsonwebtoken');

chai.use(require('chai-as-promised'));

describe('User controller', () => {

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

    describe('POST /login', () => {

        it('should return a token and user when passed valid info', () => {
            return expect (
                createUser().then(() => {
                    return request(server)
                        .post('/login')
                        .send({email: genericUser.email, password: genericUser.password})
                }).then((res) => {
                    return res.body;
                })
            ).to.eventually.have.keys('token', 'user');
        });

        it('should return a message when passed wrong email', () => {

            return expect(
                createUser().then(() => {
                    return request(server)
                        .post('/login')
                        .send({email: 'wrongemail@email.com', password: genericUser.password})
                        .expect(401)
                }).then((res) => {
                    return res.body;
                })
            ).to.eventually.deep.equal({msg: 'Invalid email or password.'});

        });

        it('should return a message when passed wrong password', () => {

            return expect(
                createUser().then(() => {
                    return request(server)
                        .post('/login')
                        .send({email: genericUser.email, password:  'wrongpassword'})
                        .expect(401)
                }).then((res) => {
                    return res.body;
                })
            ).to.eventually.deep.equal({msg: 'Invalid email or password.'});

        });

    });

    describe('POST /signup', () => {

        it('should create a new user', () => {

            return expect(
                request(server)
                    .post('/signup')
                    .send({email: genericUser.email, password: genericUser.password, name: genericUser.name})
                    .then((res) => {
                        return knex.select('email', 'name').from('users').where('email', genericUser.email);
                    })
                    .then(([user]) => {
                        return user;
                    })
            ).to.eventually.deep.equal({email: genericUser.email, name: genericUser.name});

        });

        it('should return an error any of the parameters are not empty or not valid', () => {

            return expect(
                request(server)
                    .post('/signup')
                    .send({email: 'jld.com', password: 'abc', name: ''})
                    .expect(400)
                    .then((res) => {
                        return res.body;
                    })
            ).to.eventually.deep.equal([
                { msg: "Name cannot be empty." },
                { msg: "Email is not valid." },
                { msg: "Password must be at least 8 characters long." }]);

        });

        it('should return an error we try to use the same email twice', () => {

            return expect(
                createUser().then(() => {
                    return request(server)
                        .post('/signup')
                        .send(genericUser)
                        .expect(400)
                }).then((res) => {
                    return res.body;
                })
            ).to.eventually.deep.equal({
                msg: 'The email address you have entered is already associated with another account.'
            });

        });
    });

    describe('PUT /account', () => {

        it('should update the password correctly', () => {
            return expect(
                generateRequest('put', '/account',
                    {old_password: genericUser.password, password: 'newpassword', confirm: 'newpassword'}, true)
            ).to.eventually.deep.equal({msg: 'Your password has been changed.'});
        });

        it('should update the rest of the parameters correctly', () => {
            let updatedUser = Object.assign({}, genericUser, {id: 1, email: 'johndoe@email.com'});
            delete updatedUser.password;
            delete updatedUser.facebook;
            delete updatedUser.twitter;
            delete updatedUser.google;
            delete updatedUser.github;
            delete updatedUser.picture;
            return expect(
                generateRequest('put', '/account', {email: updatedUser.email}, true)
            ).to.eventually.deep.equal({
                msg: 'Your profile information has been updated.',
                user: updatedUser
            });
        });

        it('should return an error if the user tries to change the password without valid original password', () => {

            return expect(
                generateRequest('put', '/account', {old_password: 'wrongpassword',
                    password: 'newpassword', confirm: 'newpassword'}, true)
            ).to.eventually.deep.equal({msg: 'Wrong password.'});

        });

        it('should return an error if password and confirm fields do not match', () => {
           return expect(
               generateRequest('put', '/account',
                   {old_password: genericUser.password, password: 'password1', confirm: 'wrongconfirm'}, true)
           ).to.eventually.deep.equal([{msg: 'Passwords must match.'}]);
        });
    });

    describe('DELETE /account', () => {

        it('should successfully delete user account', () => {

            return expect(
                generateRequest('delete', '/account', null, true)
            ).to.eventually.deep.equal({msg: 'Your account has been permanently deleted.'});

        });

    });

    describe('GET /unlink/:provider', () => {

        it('should successfully unlink a provider account', () => {

            return expect(
                generateRequest('get', '/unlink/facebook', null, true)
            ).to.eventually.deep.equal({ msg: 'Your account has been unlinked.' });

        });

        it('should return an error if we try to unlink a nonexistent provider', () => {

            return expect(
                generateRequest('get', '/unlink/nonexistent', null, true)
            ).to.eventually.deep.equal({msg: 'Invalid provider name.'});

        });

    });
});