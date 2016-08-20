const knex = require('../config/database');
const bcrypt = require('bcryptjs');

/*
 * Generic message to display for unexpected server errors.
 */
const genericMessage = {
    msg: 'An error occurred. Please try again later.'
};

// Hides password, passwordResetToken, passwordResetExpires
// and timestamps(created_at and updated_at).
function hideFields(user) {
    delete user.password;
    delete user.password_reset_token;
    delete user.password_reset_expires;
    delete user.created_at;
    delete user.updated_at;
}


/**
 * User Model Schema:
 * - id PRIMARY KEY SERIAL,
 * - email VARCHAR(255) UNIQUE,
 * - password VARCHAR(255) - Hashed and Salted
 * - password_reset_token VARCHAR(255) - Sent to user's email when they request a password reset, otherwise NULL.
 * - password_reset_expires DATETIME,
 * - gender VARCHAR(255) - Male or Female,
 * - location VARCHAR(255),
 * - website VARCHAR(255) - User's personal website,
 * - picture VARCHAR(255) - Link to user's profile picture,
 * - facebook VARCHAR(255) - Link to user's facebook if linked,
 * - twitter VARCHAR(255) - Link to user's twitter if linked,
 * - google VARCHAR(255) - Link to user's google+ if linked,
 * - github VARCHAR(255) - Link to user's github if linked,
 * - created_at TIMESTAMPZ,
 * - updated_at TIMESTAMPZ.
 */
const User = {

    verifyUser(email, password) {
        return new Promise((resolve, reject)=> {

            knex.select("*").from('users').where({email})
                .then(([user]) => {

                    if (!user || !bcrypt.compareSync(password, user.password)) {
                        throw {
                            type: 'INVALID_INFO',
                            msg: 'Invalid email or password.'
                        }
                    } else {
                        hideFields(user);
                        resolve(user);
                    }

                }).catch((error) => {

                    const err = error.type === 'INVALID_INFO' ? {msg: error.msg} : genericMessage;
                    reject(err);

                });
        });
    },

    createUser(email, password, name) {
        return new Promise((resolve, reject) => {

            if(!email)
                reject({msg: 'Email cannot be empty.'});
            if(!password)
                reject({msg: 'Password cannot be empty.'});
            if(!name)
                reject({msg: 'Name cannot be empty.'});

            knex('users')
                .returning(['id', 'name', 'email', 'gender', 'location', 'website',
                    'picture', 'facebook', 'twitter', 'google', 'github'])
                .insert({email, name, password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))})
                .then(([user]) =>{
                    resolve(user);
                })
                .catch((err) => {
                    let error;
                    if(err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
                        error = { msg: 'The email address you have entered is already associated with another account.' };
                    } else {
                        error = genericMessage;
                    }
                    reject(error);
                });

        });
    },

    changePassword(id, oldPassword, newPassword) {
        return new Promise((resolve, reject) => {

            knex.select('password').from('users').where('id', id)
                .then(([user]) => {
                    if(!bcrypt.compareSync(oldPassword, user.password)) {
                        throw {
                            type: 'WRONG_PASSWORD',
                            msg: 'Wrong password.'
                        }
                    }
                    return knex('users').where('id', id).update({
                        password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10))
                    });
                })
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    if(err.type === 'WRONG_PASSWORD')
                        reject({msg: err.msg});
                    else
                        reject(genericMessage);
                });

        })
    },

    updateUser(id, newUserInfo) {
        return new Promise((resolve, reject) => {
            knex('users').where('id', id).update(newUserInfo)
                .returning(['id', 'email', 'name', 'gender', 'location', 'website'])
                .then(([user]) => {
                    resolve(user);
                })
                .catch((err) => {
                    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505') {
                        reject({
                            msg: 'The email address you have entered is already associated with another account.'
                        });
                    } else {
                        reject(genericMessage);
                    }
                });
        });

    },

    getUser(id) {
        return new Promise((resolve, reject) => {

            knex.select("*").from('users').where({id})
                .then(([user]) => {
                    if(!user)
                        throw { type: 'INVALID_ARGUMENTS', msg: 'No user found.' };
                    hideFields(user);
                    resolve(user);
                }).catch((err) => {
                    if(err.type === 'INVALID_ARGUMENTS')
                        reject({msg: err.msg})
                    else
                        reject(genericMessage);
                });
        });
    }

};

export default User;