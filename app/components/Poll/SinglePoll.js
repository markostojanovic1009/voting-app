import React from 'react';
import {browserHistory } from 'react-router';
import {connect} from 'react-redux';
import update from 'react-addons-update';
import { getPoll, vote, addOptions, deletePoll } from '../../actions/poll_actions';
import Messages from '../Messages';

class SinglePoll extends React.Component {

    constructor() {
        super();
        this.state = {
            chosenOptionId: 0,
            additionalOptions: [{
                text: ''
            }],
            displayAdditionalInput: false
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

        const prevPollState = prevProps.polls.items[0];
        const currentPollState = this.props.polls.items[0];

        // Draw the chart when poll info is received initially.
        // Only redraw if poll was updated, or if the user voted
        if((!prevPollState && currentPollState) || (prevPollState && currentPollState && (prevPollState.options.length < currentPollState.options.length ||
            prevPollState.total < currentPollState.total)))
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

    additionalOptionsTextChange(index, event) {
        this.setState({
            additionalOptions: update( this.state.additionalOptions, {
                [index]: {
                    $set: {
                        text: event.target.value
                    }
                }
            })
        });
    }

    addOptionsTextInput() {
        this.setState({
            additionalOptions: update(this.state.additionalOptions, {
                $push: [{
                    text: ''
                }]
            })
        });
    }

    displayAdditionalInput() {
        this.setState({displayAdditionalInput: true});
    }

    updatePoll(poll_id) {
        this.props.dispatch(addOptions(poll_id, this.state.additionalOptions, this.props.token));
        this.setState({
            additionalOptions: [{
                text: ''
            }]
        });
        this.setState({displayAdditionalInput: false});
    }

    deletePoll(poll_id) {
        this.props.dispatch(deletePoll(poll_id, this.props.token));
    }

    render() {
        const poll = this.props.polls.items[0];

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

        const modifyPollControls = poll && this.props.user && poll.owner_id == this.props.user.id ?
            <div className="modify-poll-controls">
                { this.state.displayAdditionalInput ?
                    <div>
                        <div className="row">
                            { this.state.additionalOptions.map((optionInput, index) => {
                                return (
                                    <div className="small-8 column"
                                         key={index}>
                                        <input type="text" value={optionInput.text}
                                               className="additional-option-text"
                                               placeholder="Option text"
                                               onChange={this.additionalOptionsTextChange.bind(this, index)}/>
                                    </div>
                                );
                            }) }
                            <div className="small-4 column">
                                <button className="button"
                                        onClick={this.addOptionsTextInput.bind(this)}>+</button>
                            </div>
                        </div>

                        <div className="small-4 column">
                            <button className="info button poll-modify-button"
                                    onClick={this.updatePoll.bind(this, poll.id)}>Add options</button>
                        </div>

                        <div className="small-12 column">
                            <button className="alert button poll-modify-button"
                                    onClick={this.deletePoll.bind(this, poll.id)}>Delete Poll</button>
                            <span className="delete-poll-warning-text">This action cannot be reverted.</span>
                        </div>

                    </div> :
                    <div className="small-4 column">
                        <button className="button"
                                onClick={this.displayAdditionalInput.bind(this)}>Modify poll
                        </button>
                    </div>
                }
            </div> : null;

        const chart = (poll && poll.options.length === 0) ?
            <div className="single-poll-no-votes">
                Be the first one to vote!
            </div> : <div id="chart"></div>;

        return(
            <div>

                <div className="row">
                    <div className="small-12">
                        {optionPanel}
                    </div>
                </div>

                <div className="row">
                    {modifyPollControls}
                </div>

                <div className="row">
                    <div className="small-12 medium-4 medium-offset-4">
                        <Messages messages={this.props.messages} />
                    </div>
                </div>

                <div className="row">
                    <div className="small-12">
                        {chart}
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

export default connect(mapStateToProps)(SinglePoll);