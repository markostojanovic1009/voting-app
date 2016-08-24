const knex = require('../../config/database');
const chai = require('chai');
const bcrypt = require('bcryptjs');
const expect = chai.expect;

import Poll from '../../models/Poll';

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
            ).to.be.rejected.and.eventually.deep.equal({mgs: 'Wrong user id.'});
        });

    });

});