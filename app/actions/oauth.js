import url from 'url';
import qs from 'querystring';
import moment from 'moment';
import cookie from 'react-cookie';
import { browserHistory } from 'react-router';

// Sign in with Facebook
export function facebookLogin(redirectPath) {
  const facebook = {
    url: 'http://poll-r.herokuapp.com/auth/facebook',
    clientId: '763886170417545',
    redirectUri: 'http://poll-r.herokuapp.com/auth/facebook/callback',
    authorizationUrl: 'https://www.facebook.com/v2.7/dialog/oauth',
    scope: 'email,user_location',
    width: 580,
    height: 400,
    redirectPath
  };

  return (dispatch) => {
    oauth2(facebook, dispatch)
      .then(openPopup)
      .then(pollPopup)
      .then(exchangeCodeForToken)
      .then(signIn)
      .then(closePopup);
  };
}

// Sign in with Twitter
export function twitterLogin(redirectPath) {
  const twitter = {
    url: 'http://poll-r.herokuapp.com/auth/twitter',
    redirectUri: 'http://poll-r.herokuapp.com/auth/twitter/callback',
    authorizationUrl: 'https://api.twitter.com/oauth/authenticate',
    redirectPath
  };

  return (dispatch) => {
    oauth1(twitter, dispatch)
      .then(openPopup)
      .then(getRequestToken)
      .then(pollPopup)
      .then(exchangeCodeForToken)
      .then(signIn)
      .then(closePopup);
  };
}

// Sign in with Google
export function googleLogin(redirectPath) {
  const google = {
    url: 'http://poll-r.herokuapp.com/auth/google',
    clientId: '907244779641-aotpjepfhsev2kn2655v58g6ugns2cer.apps.googleusercontent.com',
    redirectUri: 'http://poll-r.herokuapp.com/auth/google/callback',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
    scope: 'openid profile email',
    width: 452,
    height: 633,
    redirectPath
  };

  return (dispatch) => {
    oauth2(google, dispatch)
      .then(openPopup)
      .then(pollPopup)
      .then(exchangeCodeForToken)
      .then(signIn)
      .then(closePopup);
  };
}

// Sign in with Github
export function githubLogin(redirectPath) {
  const github = {
    url: 'http://poll-r.herokuapp.com/auth/github',
    clientId: 'ab3e0fd83cebd3b7507d',
    redirectUri: 'http://poll-r.herokuapp.com/auth/github/callback',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email profile repo',
    width: 452,
    height: 633,
    redirectPath
  };

  return (dispatch) => {
    oauth2(github, dispatch)
      .then(openPopup)
      .then(pollPopup)
      .then(exchangeCodeForToken)
      .then(signIn)
      .then(closePopup);
  };
}

// Link account
export function link(provider) {
  switch (provider) {
    case 'facebook':
      return facebookLogin();
    case 'twitter':
      return twitterLogin();
    case 'google':
      return googleLogin();
    case 'github':
      return githubLogin();
    default:
      return {
        type: 'LINK_FAILURE',
        messages: [{ msg: 'Invalid OAuth Provider' }]
      }
  }
}

// Unlink account
export function unlink(provider, token) {
  return (dispatch) => {
    return fetch('/unlink/' + provider, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`}
    }).then((response) => {
      if (response.ok) {
        return response.json().then((json) => {
          dispatch({
            type: 'UNLINK_SUCCESS',
            provider,
            messages: [json]
          });
        });
      } else {
        return response.json().then((json) => {
          dispatch({
            type: 'UNLINK_FAILURE',
            messages: [json]
          });
        });
      }
    });
  }
}

function oauth2(config, dispatch) {
  return new Promise((resolve, reject) => {
    const params = {
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      display: 'popup',
      response_type: 'code'
    };
    const url = config.authorizationUrl + '?' + qs.stringify(params);
    resolve({ url, config, dispatch });
  });
}

function oauth1(config, dispatch) {
  return new Promise((resolve, reject) => {
    resolve({ url: 'about:blank', config, dispatch });
  });
}

function openPopup({ url, config, dispatch }) {
  return new Promise((resolve, reject) => {
    const width = config.width || 500;
    const height = config.height || 500;
    const options = {
      width: width,
      height: height,
      top: window.screenY + ((window.outerHeight - height) / 2.5),
      left: window.screenX + ((window.outerWidth - width) / 2)
    };
    const popup = window.open(url, '_blank', qs.stringify(options, ','));

    if (url === 'about:blank') {
      popup.document.body.innerHTML = 'Loading...';
    }

    resolve({ window: popup, config, dispatch });
  });
}

// Only for Twitter OAuth 1.0
function getRequestToken({ window, config, dispatch }) {
  return new Promise((resolve, reject) => {
    return fetch(config.url, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirectUri: config.redirectUri
      })
    }).then((response) => {
      if (response.ok) {
        return response.json().then((json) => {
          resolve({ window, config, requestToken: json, dispatch });
        });
      }
    });
  });
}

function pollPopup({ window, config, requestToken, dispatch }) {
  return new Promise((resolve, reject) => {
    const redirectUri = url.parse(config.redirectUri);
    const redirectUriPath = redirectUri.host + redirectUri.pathname;

    if (requestToken) {
      window.location = config.authorizationUrl + '?' + qs.stringify(requestToken);
    }

    const polling = setInterval(() => {
      if (!window || window.closed) {
        clearInterval(polling);
      }
      try {
        const popupUrlPath = window.location.host + window.location.pathname;
        if (popupUrlPath === redirectUriPath) {
          if (window.location.search || window.location.hash) {
            const query = qs.parse(window.location.search.substring(1).replace(/\/$/, ''));
            const hash = qs.parse(window.location.hash.substring(1).replace(/[\/$]/, ''));
            const params = Object.assign({}, query, hash);

            if (params.error) {
              dispatch({
                type: 'OAUTH_FAILURE',
                messages: [{ msg: params.error }]
              });
            } else {
              resolve({ oauthData: params, config, window, interval: polling, dispatch });
            }
          } else {
            dispatch({
              type: 'OAUTH_FAILURE',
              messages: [{ msg: 'OAuth redirect has occurred but no query or hash parameters were found.' }]
            });
          }
        }
      } catch (error) {
        // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        // A hack to get around same-origin security policy errors in Internet Explorer.
      }
    }, 500);
  });
}

function exchangeCodeForToken({ oauthData, config, window, interval, dispatch }) {
  return new Promise((resolve, reject) => {
    const data = Object.assign({}, oauthData, config);

    return fetch(config.url, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // By default, fetch won't send any cookies to the server
      body: JSON.stringify(data)
    }).then((response) => {
      if (response.ok) {
        return response.json().then((json) => {
          resolve({ token: json.token, user: json.user, window, interval, dispatch, redirectPath: config.redirectPath });
        });
      } else {
        return response.json().then((json) => {
          dispatch({
            type: 'OAUTH_FAILURE',
            messages: Array.isArray(json) ? json : [json]
          });
          closePopup({ window, interval });
        });
      }
    });
  });
}

function signIn({ token, user, window, interval, dispatch, redirectPath }) {
  return new Promise((resolve, reject) => {
    dispatch({
      type: 'OAUTH_SUCCESS',
      token: token,
      user: user
    });
    cookie.save('token', token, { expires: moment().add(1, 'hour').toDate() });
    if(redirectPath) {
      browserHistory.push(`${decodeURIComponent(redirectPath)}`);
    } else {
      browserHistory.push('/');
    }
    resolve({ window, interval });
  });

}


function closePopup({ window, interval }) {
  return new Promise((resolve, reject) => {
    clearInterval(interval);
    window.close();
    resolve();
  });
}

