import React from 'react';
import {connect} from 'react-redux';
import { getUserPolls } from '../../actions/poll_actions';
import PollList from './PollList';

class MyPolls extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        this.props.dispatch(getUserPolls(this.props.user.id, this.props.token, 1, true));
    }

    handlePollPagination(pageNumber) {
        this.props.dispatch(getUserPolls(this.props.user.id, this.props.token, pageNumber));
    }

    render() {
        return(
            <div>
                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2">
                        <h2 className="poll-header">Your polls</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2">
                        <PollList polls={this.props.polls} getPolls={this.handlePollPagination.bind(this)}/>
                    </div>
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