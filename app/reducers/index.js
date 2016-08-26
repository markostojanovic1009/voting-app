import { combineReducers } from 'redux';
import messages from './messages';
import auth from './auth';
import polls from './polls';

export default combineReducers({
  messages,
  auth,
  polls
});
