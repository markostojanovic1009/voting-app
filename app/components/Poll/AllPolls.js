import React from 'react';
import {connect} from 'react-redux';
import { getAllPolls } from '../../actions/poll_actions';
import PollList from './PollList';

class AllPolls extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        this.props.dispatch(getAllPolls());
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
                        <PollList polls={this.props.polls} />
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