const knex = require('../config/database');
const bcrypt = require('bcryptjs');

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
    return user;
}

const User = {

    verifyUser(email, password) {
        return new Promise((resolve, reject)=> {

            knex.select("*").from('users').where({email}).then(([user]) => {

                if (!user || !bcrypt.compareSync(password, user.password)) {
                    throw {
                        type: 'INVALID_INFO',
                        msg: 'Invalid email or password.'
                    }
                } else {
                    resolve(hideFields(user));
                }
            }).catch((error) => {
                const err = error.type === 'INVALID_INFO' ? {msg: error.msg} : genericMessage;
                reject(err);
            });
        });
    }

};

export default User;