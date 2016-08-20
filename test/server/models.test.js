const knex = require('../../config/database');
const chai = require('chai');
const bcrypt = require('bcryptjs');
const expect = chai.expect;

import User from '../../models/User';

chai.use(require('chai-as-promised'));

describe('User Model', () => {

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

    describe('verifyUser', () => {

        it('should be fulfill and return a user when valid email and password are passed', () => {

           /*
            * Adds id:1 and deletes the password field so that it matches the
            * expected output format.
            */
            const expected = Object.assign({}, genericUser, {id: 1});
            delete expected.password;

            return expect(
                createUser().then(() => {
                    return User.verifyUser(genericUser.email, genericUser.password);
                })
            ).to.eventually.deep.equal(expected);

        });

        it('should be rejected with appropriate message when wrong email is sent', () => {

            return expect(
                createUser().then(() => {
                    return User.verifyUser('wrongEmail', genericUser.password);
                })
            ).to.be.rejected.eventually.deep.equal({msg: 'Invalid email or password.'});

        });

        it('should be rejected with appropriate message when wrong password is sent', () => {
            return expect(
                createUser().then(() => {
                    return User.verifyUser(genericUser.email, 'wrongPassword');
                })
            ).to.be.rejected.eventually.deep.equal({msg: 'Invalid email or password.'});
        })

    });

    describe('createUser', () => {

        it('should create a new user when passed valid info', () => {
            const newUser = {
                email: 'john@email.com',
                password: 'password',
                name: 'John Doe'
            };
            return expect(
                User.createUser(newUser.email, newUser.password, newUser.name)
                    .then((user) => {
                        return user;
                    })
            ).to.eventually.deep.equal({
                email: newUser.email,
                name: newUser.name,
                id: 1,
                gender: null,
                picture: null,
                location: null,
                website: null,
                facebook: null,
                google: null,
                twitter: null,
                github: null
            });
        });

        it('should return an error if email/password/name is empty', () => {
            /*
             * Testing for both password and name would be exactly the same.
             */
            return expect (
                User.createUser('', null, '')
            ).to.be.rejected.and.eventually.deep.equal({msg: 'Email cannot be empty.'});
        });

        it('should return an error if we try to enter a duplicate email', () => {

            return expect(
                createUser().then(() => {
                   return User.createUser(genericUser.email, genericUser.password, genericUser.name);
                })
            ).to.be.rejected.and.eventually.deep.equal({
                msg: 'The email address you have entered is already associated with another account.'
            });

        });



    });

});