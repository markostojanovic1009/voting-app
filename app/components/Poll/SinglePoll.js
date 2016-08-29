import React from 'react';
import {browserHistory } from 'react-router';
import {connect} from 'react-redux';
import { getPoll } from '../../actions/poll_actions';

class SinglePoll extends React.Component {

    constructor() {
        super();
    }

    componentDidMount() {
        const { poll_id } = this.props.params;
        if(!Number.isInteger(parseInt(poll_id))) {
            browserHistory.push('/*');
        }
        this.props.dispatch(getPoll(poll_id));
    }

    componentDidUpdate() {
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
    
    render() {
        const poll = this.props.polls.items[0];
        const chart = (poll && poll.options.length === 0) ?
            <div className="single-poll-no-votes">
                Be the first one to vote!
            </div> : <div id="chart"></div>;
        const optionPanel = poll ?
            <div>
                <div className="single-poll-title">{poll.title}</div>
                <div className="options">
                    <ul>
                        { poll.options.map((item) => {
                            return (
                                <li key={item.poll_option_id}>
                                    {item.text}
                                </li>
                            );
                        }) }
                    </ul>
                </div>
            </div> : null;
        return(
            <div className="row">
                <div className="small-12">
                    {optionPanel}
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
        polls: state.polls
    };
};

export default connect(mapStateToProps)(SinglePoll);