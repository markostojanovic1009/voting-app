var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var request = require('request');
var qs = require('querystring');
import User from '../models/User';

function generateToken(user) {
    var payload = {
        iss: 'my.domain.com',
        sub: user.id,
        iat: moment().unix(),
        exp: moment().add(7, 'days').unix()
    };
    return jwt.sign(payload, process.env.TOKEN_SECRET);
}

/*
 * Removes unnecessary properties from error objects.
 */
function mapValidationErrors(errors) {
    return errors.map((error) => {
        return { msg: error.msg };
    })
}

/**
 * Login required middleware
 */
exports.ensureAuthenticated = function(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).send({ msg: 'Unauthorized' });
    }
};
/**
 * POST /login
 * Sign in with email and password
 */
exports.loginPost = function(req, res, next) {
    req.assert('email', 'Email is not valid.').isEmail();
    req.assert('email', 'Email cannot be blank.').notEmpty();
    req.assert('password', 'Password cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    var errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(mapValidationErrors(errors));
    }

    User.verifyUser(req.body.email, req.body.password).then((user) => {
        res.status(200).send({ token: generateToken(user), user });
    }).catch((error) => {
        res.status(401).send(error);
    });
};

/**
 * POST /signup
 */
exports.signupPost = function(req, res, next) {
    req.assert('name', 'Name cannot be empty.').notEmpty();
    req.assert('email', 'Email is not valid.').isEmail();
    req.assert('email', 'Email cannot be empty.').notEmpty();
    req.assert('password', 'Password must be at least 8 characters long.').len(8);
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    var errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(mapValidationErrors(errors));
    }

    User.createUser(req.body.email, req.body.password, req.body.name).then((user) => {
        res.send({token: generateToken(user), user})
    }).catch((error) => {
        res.status(400).send(error);
    });
};


/**
 * PUT /account
 * Update profile information OR change password.
 */
exports.accountPut = function(req, res, next) {
    if ('password' in req.body) {
        req.assert('password', 'Password must be at least 8 characters long').len(8);
        req.assert('confirm', 'Passwords must match.').equals(req.body.password);
    } else {
        req.assert('email', 'Email is not valid').isEmail();
        req.assert('email', 'Email cannot be blank').notEmpty();
        req.sanitize('email').normalizeEmail({ remove_dots: false });
    }

    var errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(mapValidationErrors(errors));
    }

    if('password' in req.body) {
        User.changePassword(req.user.id, req.body.old_password, req.body.password).then(() => {
            res.send({ msg: 'Your password has been changed.' });
        }).catch((error) => {
            res.status(401).send(error);
        });
    } else {
        User.updateUser(req.user.id, {
            email: req.body.email,
            name: req.body.name,
            gender: req.body.gender,
            location: req.body.location,
            website: req.body.website
        }).then((user) => {
            res.send({ user, msg: 'Your profile information has been updated.'});
        }).catch((error) => {
            res.status(400).send(error);
        })

    }

};

/**
 * DELETE /account
 */
exports.accountDelete = function(req, res, next) {
    User.deleteUser(req.user.id).then(() => {
        res.send({ msg: 'Your account has been permanently deleted.' });
    }).catch((error) => {
        res.status(400).send(error);
    });
};

/**
 * GET /unlink/:provider
 */
exports.unlink = function(req, res, next) {
    User.removeProvider(req.user.id, req.params.provider).then(() => {
        res.status(200).send({ msg: 'Your account has been unlinked.' });
    }).catch((error) => {
        res.status(400).send(error);
    });
};

/**
 * POST /forgot
 */
exports.forgotPost = function(req, res, next) {
    req.assert('email', 'Email is not valid').isEmail();
    req.assert('email', 'Email cannot be blank').notEmpty();
    req.sanitize('email').normalizeEmail({ remove_dots: false });

    var errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(errors);
    }

    async.waterfall([
        function(done) {
            crypto.randomBytes(16, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.getUser({email: req.body.email})
                .then((user) => {
                    if(!user) {
                        throw { type: 'NO_USER'};
                    }
                    return User.updateUser(user.id, {
                        password_reset_token: token,
                        password_reset_expires: new Date(Date.now() + 3600000) // 1 Hour later.
                    });
                })
                .then((user) => {
                    var transporter = nodemailer.createTransport({
                        service: 'Mailgun',
                        auth: {
                            user: process.env.MAILGUN_USERNAME,
                            pass: process.env.MAILGUN_PASSWORD
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'support@boilerplate.com',
                        subject: 'Reset your password on Boilerplate',
                        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                    };
                    transporter.sendMail(mailOptions);
                    res.send({ msg: 'An email has been sent to ' + user.email + ' with further instructions.' });
                })
                .catch((error) => {
                    if(error.type === 'NO_USER')
                        return res.status(400).send({ msg: 'The email address ' + req.body.email + ' is not associated with any account.' });
                    else
                        return res.status(400).send({ msg: 'An error occurred. Please try again later.'});
                });
        }
    ]);
};

/**
 * POST /reset/:token
 */
exports.resetPost = function(req, res, next) {
    req.assert('password', 'Password must be at least 8 characters long').len(8);
    req.assert('confirm', 'Passwords must match').equals(req.body.password);

    var errors = req.validationErrors();

    if (errors) {
        return res.status(400).send(mapValidationErrors(errors));
    }

    User.resetPassword(req.body.password, req.params.token)
        .then((user) => {
            var transporter = nodemailer.createTransport({
                service: 'Mailgun',
                auth: {
                    user: process.env.MAILGUN_USERNAME,
                    pass: process.env.MAILGUN_PASSWORD
                }
            });
            var mailOptions = {
                from: 'support@boilerplate.com',
                to: user.email,
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
            };
            transporter.sendMail(mailOptions);
            res.send({ msg: 'Your password has been changed successfully.' });
        })
        .catch((error) => {
            res.status(400).send(error);
        });
};

/**
 * POST /auth/facebook
 * Sign in with Facebook
 */
exports.authFacebook = function(req, res) {

    /*
        Configuration as per Facebook API instructions.
     */
    var profileFields = ['id', 'name', 'email', 'gender', 'location'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.7/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.7/me?fields=' + profileFields.join(',');

    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: process.env.FACEBOOK_SECRET,
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function(err, response, accessToken) {
        if (accessToken.error) {
            return res.status(500).send({ msg: accessToken.error.message });
        }

        // Step 2. Retrieve user's profile information.
        request.get({ url: graphApiUrl, qs: accessToken, json: true }, function(err, response, profile) {
            if (profile.error) {
                return res.status(500).send({ msg: profile.error.message });
            }

            // Step 3a. Link accounts if user is authenticated.
            // This step is for linking the account AFTER the user already has an account.
            if (req.isAuthenticated()) {
                User.getUser({facebook: profile.id}).then((user) => {
                    if(user) {
                        throw { type: 'ACCOUNT_LINKED_ALREADY' };
                    } else {
                        return User.updateUser(req.user.id, {
                            name: req.user.name || profile.name,
                            gender: req.user.gender || profile.gender,
                            picture: req.user.picture || `https://graph.facebook.com/${profile.id}/picture?type=large`,
                            facebook: profile.id
                        });
                    }
                }).then((updatedUser) => {
                    res.send({token: generateToken(updatedUser), user: updatedUser});
                }).catch((error) => {
                    if(error.type === 'ACCOUNT_LINKED_ALREADY')
                        return res.status(409).send({
                            msg: 'There is already an existing account linked with Facebook that belongs to you.'
                        });
                    return res.status(400).send({msg: 'An error occurred. Please try again later.'});
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                // This part is for logging in or creating a new account via Facebook.
                User.getUser({facebook: profile.id }).then((user) => {
                    // User has an account. Log him in
                    if (user) {
                        throw {type: 'USER_FOUND', user};
                    }
                    // Otherwise, see if user has an account with the email
                    // the same as the email regiestered to facebook.
                    return User.getUser({email: profile.email, facebook: null});
                }).then((unlinkedUser) => {
                    // In that case, just link the facebook account. Otherwise
                    // create a new account. I put 'nopassword' as password because it's required
                    // by User.createUser, and it doesn't matter because it will never be used again.
                    return unlinkedUser || User.createUser(profile.email, 'nopassword', profile.name);
                }).then((user) => {
                    return User.updateUser(user.id, {
                        gender: profile.gender,
                        location: profile.location && profile.location.name,
                        picture: `https://graph.facebook.com/${profile.id}/picture?type=large`,
                        facebook: profile.id
                    });
                }).then((newUser) => {
                    return res.send({token: generateToken(newUser), user: newUser});
                }).catch((error) => {
                    if(error.type === 'USER_FOUND')
                        res.send({token: generateToken(error.user), user: error.user});
                    else
                        res.status(400).send(error);
                });
            }
        });
    });
};

exports.authFacebookCallback = function(req, res) {
    res.render('loading');
};
/**
 * POST /auth/google
 * Sign in with Google
 */
exports.authGoogle = function(req, res) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';

    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: process.env.GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };
    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
     var accessToken = token.access_token;
     var headers = { Authorization: 'Bearer ' + accessToken };

        // Step 2. Retrieve user's profile information.
        request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
            if (profile.error) {
                return res.status(500).send({ message: profile.error.message });
            }

            // Step 3a. Link accounts if user is authenticated.
            // This step is for linking the account AFTER the user already has an account.
            if (req.isAuthenticated()) {
                User.getUser({google: profile.sub}).then((user) => {
                    if(user) {
                        throw { type: 'ACCOUNT_LINKED_ALREADY' };
                    } else {
                        return User.updateUser(req.user.id, {
                            name: req.user.name || profile.name,
                            gender: req.user.gender || profile.gender,
                            picture: req.user.picture || profile.picture.replace('sz=50', 'sz=200'),
                            location: req.user.location || profile.location,
                            google: profile.sub
                        });
                    }
                }).then((updatedUser) => {
                    res.send({token: generateToken(updatedUser), user: updatedUser});
                }).catch((error) => {
                    if(error.type === 'ACCOUNT_LINKED_ALREADY')
                        return res.status(409).send({
                            msg: 'There is already an existing account linked with Google that belongs to you.'
                        });
                    return res.status(400).send({msg: 'An error occurred. Please try again later.'});
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                // This part is for logging in or creating a new account via Google.
                User.getUser({google: profile.sub }).then((user) => {
                    // User has an account. Log him in
                    if (user) {
                        throw {type: 'USER_FOUND', user};
                    }
                    // Otherwise, see if user has an account with the email
                    // the same as the email regiestered to google.
                    return User.getUser({email: profile.email, google: null});
                }).then((unlinkedUser) => {
                    // In that case, just link the facebook account. Otherwise
                    // create a new account. I put 'nopassword' as password because it's required
                    // by User.createUser, and it doesn't matter because it will never be used again.
                    return unlinkedUser || User.createUser(profile.email, 'nopassword', profile.name);
                }).then((user) => {
                    return User.updateUser(user.id, {
                        gender: profile.gender,
                        location: profile.location,
                        picture: profile.picture.replace('sz=50', 'sz=200'),
                        google: profile.sub
                    });
                }).then((newUser) => {
                    return res.send({token: generateToken(newUser), user: newUser});
                }).catch((error) => {
                    if(error.type === 'USER_FOUND')
                        res.send({token: generateToken(error.user), user: error.user});
                    else
                        res.status(400).send(error);
                });
            }
        });
    });

};

exports.authGoogleCallback = function(req, res) {
    res.render('loading');
};
/**
 * POST /auth/twitter
 * Sign in with Twitter
 */
exports.authTwitter = function(req, res) {
    var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
    var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
    var profileUrl = 'https://api.twitter.com/1.1/users/show.json?screen_name=';

    // Part 1 of 2: Initial POST request to obtain OAuth request token.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauthSignature = {
            consumer_key: process.env.TWITTER_KEY,
            consumer_secret: process.env.TWITTER_SECRET,
            callback: req.body.redirectUri
        };

        // Step 1. Obtain request token to initiate app authorization.
        // At this point nothing is happening inside a popup yet.
        request.post({ url: requestTokenUrl, oauth: requestTokenOauthSignature }, function(err, response, body) {
            var oauthToken = qs.parse(body);

            // Step 2. Send OAuth token back.
            // After request token is sent back, a popup will redirect to the Twitter app authorization screen.
            // Unlike Facebook and Google (OAuth 2.0), we have to do this extra step for Twitter (OAuth 1.0).
            res.send(oauthToken);
        });
    } else {
        // Part 2 of 2: Second POST request after "Authorize app" button is clicked.
        // OAuth 2.0 basically starts from Part 2, but with OAuth 1.0 we need to do that extra step in Part 1.
        var accessTokenOauth = {
            consumer_key: process.env.TWITTER_KEY,
            consumer_secret: process.env.TWITTER_SECRET,
            token: req.body.oauth_token,
            verifier: req.body.oauth_verifier
        };

        // Step 3. Exchange "oauth token" and "oauth verifier" for access token.
        request.post({ url: accessTokenUrl, oauth: accessTokenOauth }, function(err, response, accessToken) {
            accessToken = qs.parse(accessToken);

            var profileOauth = {
                consumer_key: process.env.TWITTER_KEY,
                consumer_secret: process.env.TWITTER_SECRET,
                oauth_token: accessToken.oauth_token
            };

            // Step 4. Retrieve user's profile information.
            request.get({ url: profileUrl + accessToken.screen_name, oauth: profileOauth, json: true }, function(err, response, profile) {

                // Step 5a. Link accounts if user is authenticated.
                // This step is for linking the account AFTER the user already has an account.
                if (req.isAuthenticated()) {
                    User.getUser({twitter: profile.id}).then((user) => {
                        if(user) {
                            throw { type: 'ACCOUNT_LINKED_ALREADY' };
                        } else {
                            return User.updateUser(req.user.id, {
                                name: req.user.name || profile.name,
                                picture: req.user.picture || profile.profile_image_url_https,
                                location: req.user.location || profile.location,
                                twitter: profile.id
                            });
                        }
                    }).then((updatedUser) => {
                        res.send({token: generateToken(updatedUser), user: updatedUser});
                    }).catch((error) => {
                        if(error.type === 'ACCOUNT_LINKED_ALREADY')
                            return res.status(409).send({
                                msg: 'There is already an existing account linked with Twitter that belongs to you.'
                            });
                        return res.status(400).send({msg: 'An error occurred. Please try again later.'});
                    });
                } else {
                    // Step 5b. Create a new user account or return an existing one.
                    // This part is for logging in or creating a new account via Twitter.
                    User.getUser({twitter: profile.id }).then((user) => {
                        // User has an account. Log him in
                        if (user) {
                            throw {type: 'USER_FOUND', user};
                        }
                        // Use the email address 'hack' to check if user created an account with twitter.
                        // See comment below.
                        return User.getUser({email: `${profile.screen_name}@twitter.com`, google: null});
                    }).then((unlinkedUser) => {
                        // Twitter does not provide an email address, but email is a required field in our User schema.
                        // We can "fake" a Twitter email address as follows: screen_name@twitter.com.
                        return unlinkedUser || User.createUser(`${profile.screen_name}@twitter.com`, 'nopassword', profile.name);
                    }).then((user) => {
                        return User.updateUser(user.id, {
                            location: profile.location,
                            picture: profile.profile_image_url_https,
                            twitter: profile.id
                        });
                    }).then((newUser) => {
                        return res.send({token: generateToken(newUser), user: newUser});
                    }).catch((error) => {
                        if(error.type === 'USER_FOUND')
                            res.send({token: generateToken(error.user), user: error.user});
                        else
                            res.status(400).send(error);
                    });
                }

            });
        });
    }
};

exports.authTwitterCallback = function(req, res) {
    res.render('loading');
};
/**
 * POST /auth/google
 * Sign in with Github
 */
exports.authGithub = function(req, res) {
    var accessTokenUrl = 'https://github.com/login/oauth/access_token';
    var userUrl = 'https://api.github.com/user';

    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: process.env.GITHUB_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
        var accessToken = token.access_token;
        var headers = {
            Authorization: 'Bearer ' + accessToken,
            'User-Agent': 'MegaBoilerplate'
        };
        // Step 2. Retrieve user's profile information.
        request.get({ url: userUrl, headers: headers, json: true }, function(err, response, profile) {
            if (profile.error) {
                return res.status(500).send({ message: profile.error.message });
            }
            // Step 3a. Link accounts if user is authenticated.

            if (req.isAuthenticated()) {
                User.getUser({github: profile.id}).then((user) => {
                    if(user) {
                        throw { type: 'ACCOUNT_LINKED_ALREADY' };
                    } else {
                        return User.updateUser(req.user.id, {
                            name: req.user.name || profile.name,
                            picture: req.user.picture || profile.avatar_url,
                            location: req.user.location || profile.location,
                            github: profile.id
                        });
                    }
                }).then((updatedUser) => {
                    res.send({token: generateToken(updatedUser), user: updatedUser});
                }).catch((error) => {
                    if(error.type === 'ACCOUNT_LINKED_ALREADY')
                        return res.status(409).send({
                            msg: 'There is already an existing account linked with Github that belongs to you.'
                        });
                    return res.status(400).send({msg: 'An error occurred. Please try again later.'});
                });
            } else {
                // Step 3b. Create a new user account or return an existing one.
                // This part is for logging in or creating a new account via Github.
                User.getUser({github: profile.id }).then((user) => {
                    // User has an account. Log him in
                    if (user) {
                        throw {type: 'USER_FOUND', user};
                    }
                    // Otherwise, see if user has an account with the email
                    // the same as the email regiestered to github.
                    const email = profile.email || `${profile.login}@github.com`; // See comment below.
                    return User.getUser({email, github: null});
                }).then((unlinkedUser) => {

                    // In that case, just link the github account. Otherwise
                    // create a new account. I put 'nopassword' as password because it's required
                    // by User.createUser, and it doesn't matter because it will never be used again.

                    // If the user chose to set his email to private on github, email field
                    // will be null, so I use this 'hack' to add the email which is required by
                    // User schema.
                    const email = profile.email || `${profile.login}@github.com`;

                    return unlinkedUser || User.createUser(email, 'nopassword', profile.name);
                }).then((user) => {
                    return User.updateUser(user.id, {
                        location: profile.location,
                        picture: profile.avatar_url,
                        github: profile.id
                    });
                }).then((newUser) => {
                    return res.send({token: generateToken(newUser), user: newUser});
                }).catch((error) => {
                    if(error.type === 'USER_FOUND')
                        res.send({token: generateToken(error.user), user: error.user});
                    else
                        res.status(400).send(error);
                });
            }

        });
    });
};

exports.authGithubCallback = function(req, res) {
    res.render('loading');
};