import React from 'react';
import { connect } from 'react-redux'
import Messages from './Messages';
import {Link} from 'react-router';

class Home extends React.Component {
  render() {
    return (
      <div className="row">
        <Messages messages={this.props.messages}/>

        <div className="row">
          <div className="small-12 welcome-header">
            <h1>
              Welcome to Poll-it
            </h1>
            <h3>
              Your opinion matters. Vote now.
            </h3>
          </div>
        </div>

        <div className="row">
          <div className="small-12 medium-8 medium-offset-2">
            <div className="welcome-subheader">
              <Link to="/polls/all" className="large button">See recent polls</Link>
              <Link to="/polls/new" className="large button green-button">Create your own!</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    messages: state.messages
  };
};

export default connect(mapStateToProps)(Home);
