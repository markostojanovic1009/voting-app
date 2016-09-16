const express = require('express');
const path = require('path');
const logger = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const React = require('react');
const ReactDOM = require('react-dom/server');
const Router = require('react-router');
const Provider = require('react-redux').Provider;
const jwt = require('jsonwebtoken');
const moment = require('moment');
const request = require('request');

// Load environment constiables from .env file
if(!process.env.NODE_ENV) {
  const dotenv = require('dotenv');
  dotenv.load();
}

// ES6 Transpiler
require('babel-core/register');
require('babel-polyfill');

// Models
const User = require('./models/User').default;

// Controllers
const userController = require('./controllers/user');
const contactController = require('./controllers/contact');
const pollController = require('./controllers/poll');

// React and Server-Side Rendering
const routes = require('./app/routes');
const configureStore = require('./app/store/configureStore').default;

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next) {
  req.isAuthenticated = function() {
    const token = (req.headers.authorization && req.headers.authorization.split(' ')[1]) || req.cookies.token;
    try {
      return jwt.verify(token, process.env.TOKEN_SECRET);
    } catch (err) {
      return false;
    }
  };

  if (req.isAuthenticated()) {
    const payload = req.isAuthenticated();
    User.getUser({id: payload.sub})
      .then(function(user) {
        req.user = user;
        next();
      }).catch((err) => {
          next();
      });
  } else {
    next();
  }
});

app.put('/account', userController.ensureAuthenticated, userController.accountPut);
app.delete('/account', userController.ensureAuthenticated, userController.accountDelete);

app.post('/signup', userController.signupPost);
app.post('/login', userController.loginPost);

app.post('/forgot', userController.forgotPost);
app.post('/reset/:token', userController.resetPost);

app.get('/unlink/:provider', userController.ensureAuthenticated, userController.unlink);

app.post('/auth/facebook', userController.authFacebook);
app.get('/auth/facebook/callback', userController.authFacebookCallback);

app.post('/auth/google', userController.authGoogle);
app.get('/auth/google/callback', userController.authGoogleCallback);

app.post('/auth/twitter', userController.authTwitter);
app.get('/auth/twitter/callback', userController.authTwitterCallback);

app.post('/auth/github', userController.authGithub);
app.get('/auth/github/callback', userController.authGithubCallback);


app.get('/api/polls', pollController.getPolls);
app.post('/api/polls', userController.ensureAuthenticated, pollController.createPoll);

app.get('/api/poll/:poll_id', pollController.getPollVotes);
app.post('/api/poll/:poll_id', pollController.vote);
app.put('/api/poll/:poll_id', userController.ensureAuthenticated, pollController.updatePoll);
app.delete('/api/poll/:poll_id', userController.ensureAuthenticated, pollController.deletePoll);


// React server rendering
app.use(function(req, res) {
  const initialState = {
    auth: { token: req.cookies.token, user: req.user },
    messages: {},
    polls: { isFetching: false, items: [], pageCount: 0 }
  };

  const store = configureStore(initialState);

  Router.match({ routes: routes.default(store), location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      const html = ReactDOM.renderToString(React.createElement(Provider, { store: store },
        React.createElement(Router.RouterContext, renderProps)
      ));
      res.render('layout', {
        html: html,
        initialState: store.getState()
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
