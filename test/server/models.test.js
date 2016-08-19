const knex = require('../../config/database');
const chai = require('chai');
const bcrypt = require('bcryptjs');
const expect = chai.expect;

import User from '../../models/MyUser';

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
        return knex('users').insert({ ...genericUser, password: bcrypt.hashSync(genericUser.password, bcrypt.genSaltSync(10))});
    };

    describe('verifyUser', () => {

        it('should be fulfill and return a user when valid email and password are passed', () => {

           /*
            * Add id:1 and deletes the password field so that it matches the
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

    })
});