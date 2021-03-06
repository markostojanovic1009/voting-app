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
// These should not be sent to the controller except where explicitly needed,
// such as for changing or resetting the password.
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


    /*
     * Returns user info.
     */
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

    /*
     * Adds a new account to the database
     */
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

    changePassword(id, newPassword) {
        return new Promise((resolve, reject) => {
            if(newPassword.length < 8)
                reject({msg: 'Password must be at least 8 characters long.'});
            knex('users')
                .where('id', id)
                .update({
                    password: bcrypt.hashSync(newPassword, bcrypt.genSaltSync(10))
                })
                .then(() => {
                    resolve();
                })
                .catch((err) => {
                    reject(genericMessage);
                });
        });

    },

    /*
     * Updates the user. newUserInfo is a hash of properties to update.
     * It's passed directly to knex.update
     */
    updateUser(id, newUserInfo) {
        return new Promise((resolve, reject) => {
            knex('users').where('id', id).update(newUserInfo)
                .returning(['id', 'email', 'name', 'gender', 'location', 'picture',
                    'website', 'facebook', 'google', 'twitter', 'github'])
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

    /*
     * Gets user based on any knex.where query.
     */
    getUser(query) {
        return new Promise((resolve, reject) => {

            knex.select("*").from('users').where(query)
                .then(([user]) => {
                    if(!user)
                        resolve(null);
                    hideFields(user);
                    resolve(user);
                }).catch((err) => {
                reject(genericMessage);
            });
        });
    },

    deleteUser(id) {
        return new Promise((resolve, reject) => {
            knex('users').where('id', id).del().then(() => {
                resolve()
            }).catch((error) => {
                reject(genericMessage);
            });
        });
    },

    removeProvider(id, providerName) {
        return new Promise((resolve, reject) => {
            knex('users').where('id', id).update({[providerName]: null}).then(() => {
                resolve();
            }).catch((error) => {
                if(error.code === '42703') // Postgres code for undefined column
                    reject({ msg: 'Invalid provider name.' });
                else
                    reject(genericMessage);
            });
        });
    },

    resetPassword(password, passwordResetToken) {
        return new Promise((resolve, reject) => {
            if(password.length < 8)
                reject({msg: 'Password must be at least 8 characters long.'});
            knex('users').update({password, password_reset_token: null, password_reset_expires: null})
                .where('password_reset_token', passwordResetToken)
                .andWhere('password_reset_expires', '>', new Date())
                .returning(['email'])
                .then(([user]) => {
                    if(!user) {
                        reject({msg: 'Password reset token is invalid or has expired.'});
                    }
                    resolve(user);
                })
                .catch((error) => {
                    reject(genericMessage);
                });
        })
    }

};
export default User;