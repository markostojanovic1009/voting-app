import React from 'react';
import {browserHistory } from 'react-router';
import {connect} from 'react-redux';
import { getPoll, vote } from '../../actions/poll_actions';
import Messages from '../Messages';

class SinglePoll extends React.Component {

    constructor() {
        super();
        this.state = {
            chosenOptionId: 0
        };
    }

    componentDidMount() {
        const { poll_id } = this.props.params;
        if(!Number.isInteger(parseInt(poll_id))) {
            browserHistory.push('/*');
        } else {
            this.props.dispatch(getPoll(poll_id));
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if(prevState.chosenOptionId == this.state.chosenOptionId)
            this.drawChart();
    }

    drawChart() {
        const poll = this.props.polls.items[0];
        if(poll && poll.options.length > 0) {
            $(document).ready(() => {
                $('#chart').highcharts({

                    chart: {
                        type: 'pie',
                        options3d: {
                            enabled: true,
                            alpha: 45,
                            beta: 0
                        }
                    },

                    title: {
                        text: ""
                    },

                    tooltip: {
                        pointFormat: '<b>{point.percentage:.2f}%</b>'
                    },

                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            depth: 35,
                            dataLabels: {
                                enabled: false
                            },
                            showInLegend: true
                        }
                    },
                    series: [{
                        type: 'pie',
                        name: 'Votes',
                        data: poll.options.map((item) => {
                            return [item.text, item.count / poll.total]
                        })
                    }]
                });
            });
        }
    }

    handleSelectChange(event) {
        this.setState({ chosenOptionId: parseInt(event.target.value) });
    }

    handleVoteButtonClick(pollId) {
        const {user} = this.props;
        this.props.dispatch(vote(pollId, this.state.chosenOptionId, user ? user.id : null));
    }
    
    render() {
        const poll = this.props.polls.items[0];
        const chart = (poll && poll.options.length === 0) ?
            <div className="single-poll-no-votes">
                Be the first one to vote!
            </div> : <div id="chart"></div>;
        const optionPanel = poll ?
            <div>
                <div className="single-poll-title">{poll.title}</div>
                <div className="single-poll-options">
                    <select className="single-poll-select" onChange={this.handleSelectChange.bind(this)}
                            value={this.state.chosenOptionId}>
                        <option value={0}>Select an option</option>
                        {poll.options.map((option) => {
                            return(
                                <option key={option.poll_option_id} value={option.poll_option_id}>{option.text}</option>
                            );
                        })};
                    </select>
                    <button className="single-poll-vote button"
                            onClick={this.handleVoteButtonClick.bind(this, poll.id)} >Vote</button>
                </div>
            </div> : null;
        return(
            <div className="row">
                <div className="small-12">
                    {optionPanel}
                </div>
                <div className="small-12 medium-4 medium-offset-4">
                    <Messages messages={this.props.messages} />
                </div>
                <div className="small-12">
                    {chart}
                 </div>
            </div>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        messages: state.messages,
        polls: state.polls,
        user: state.user
    };
};

export default connect(mapStateToProps)(SinglePoll);