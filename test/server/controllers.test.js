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
});