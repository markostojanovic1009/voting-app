import React from 'react';
import {connect} from 'react-redux';
import { getUserPolls } from '../../actions/poll_actions';
import PollList from './PollList';

class MyPolls extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        this.props.dispatch(getUserPolls(this.props.user.id, this.props.token));
    }

    render() {
        return(
            <div className="row">
                <div className="small-12 medium-8 medium-offset-2">
                    <PollList polls={this.props.polls} />
                </div>
            </div>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        messages: state.messages,
        polls: state.polls,
        user: state.auth.user,
        token: state.auth.token
    };
};

export default connect(mapStateToProps)(MyPolls);