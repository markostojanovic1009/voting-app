const knex = require('../../config/database');
const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcryptjs');
const request = require('supertest-as-promised');
const server = require('../../server');

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

        it('should return a message and status code 401 when passed wrong email', () => {

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

        it('should return a message and status code 401 when passed wrong password', () => {

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
                { msg: "Password must be at least 4 characters long." }]);

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
});