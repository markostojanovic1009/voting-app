import React from 'react';
import {connect} from 'react-redux';
import { getPolls } from '../../actions/poll_actions';
import PollList from './PollList';

class AllPolls extends React.Component {

    constructor() {
        super();
    }

    // Initial call to get all polls from the first page.
    componentDidMount() {
        this.props.dispatch(getPolls(1, true));
    }

    // Get additional pages of polls.
    handlePollPagination(pageNumber) {
        this.props.dispatch(getPolls(pageNumber));
    }

    render() {
        return(
            <div>

                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2">
                        <h2 className="poll-header">Browse recent polls</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2">
                        <PollList polls={this.props.polls}
                                  getPolls={this.handlePollPagination.bind(this)}
                                  messages={this.props.messages}/>
                    </div>
                </div>

            </div>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        messages: state.messages,
        polls: state.polls
    };
};

export default connect(mapStateToProps)(AllPolls);