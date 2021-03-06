import React from 'react';
import { IndexRoute, Route } from 'react-router';
import App from './components/App';
import Home from './components/Home';
import NotFound from './components/NotFound';
import Login from './components/Account/Login';
import Signup from './components/Account/Signup';
import Profile from './components/Account/Profile';
import Forgot from './components/Account/Forgot';
import Reset from './components/Account/Reset';
import AllPolls from './components/Poll/AllPolls';
import SinglePoll from './components/Poll/SinglePoll';
import PollCreate from './components/Poll/PollCreate';
import MyPolls from './components/Poll/MyPolls';

export default function getRoutes(store) {
  const ensureAuthenticated = (nextState, replace) => {
    if (!store.getState().auth.token) {
      replace(`/login?redirect=${encodeURIComponent(nextState.routes[1].path)}`);
    }
  };
  const skipIfAuthenticated = (nextState, replace) => {
    if (store.getState().auth.token) {
      replace('/');
    }
  };
  const clearMessages = () => {
    store.dispatch({
      type: 'CLEAR_MESSAGES'
    });
  };
  return (
    <Route path="/" component={App}>
      <IndexRoute component={Home} onLeave={clearMessages}/>
      <Route path="/login" component={Login} onEnter={skipIfAuthenticated} onLeave={clearMessages}/>
      <Route path="/signup" component={Signup} onEnter={skipIfAuthenticated} onLeave={clearMessages}/>
      <Route path="/account" component={Profile} onEnter={ensureAuthenticated} onLeave={clearMessages}/>
      <Route path="/forgot" component={Forgot} onEnter={skipIfAuthenticated} onLeave={clearMessages}/>
      <Route path='/reset/:token' component={Reset} onEnter={skipIfAuthenticated} onLeave={clearMessages}/>
      <Route path="/polls/all" component={AllPolls} onLeave={clearMessages} />
      <Route path="/polls/my" component={MyPolls} onEnter={ensureAuthenticated} onLeave={clearMessages} />
      <Route path="/polls/new" component={PollCreate} onEnter={ensureAuthenticated} onLeave={clearMessages} />
      <Route path="/poll/:poll_id" component={SinglePoll} onLeave={clearMessages} />
      <Route path="*" component={NotFound} onLeave={clearMessages}/>
    </Route>
  );
}
