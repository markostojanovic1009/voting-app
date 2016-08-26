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
            <PollList polls={this.props.polls} />
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