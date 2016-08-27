import React from 'react';
import {Link} from 'react-router';
class PollList extends React.Component {
    render() {
        const loading = this.props.polls.isFetching ?
            <div>
                Loading...
            </div> : null;
        const mappedPolls = this.props.polls.items.map((item) => {
            return (
                <li className="poll-list-item" key={item.pollId}>
                    <div className="poll-title-wrapper">
                        <span className="poll-list-title">{item.title}</span>
                        <span className="poll-list-votes">{`(${item.total} votes)`}</span>
                        <Link className="vote-now-button" to="#">Vote now!</Link>
                    </div>
                    <div className="poll-options-wrapper">
                        <ul>
                            {item.options.map((option) => {
                                return(
                                    <li key={option.pollOptionId} className="poll-option-list-item">
                                        <p className="poll-option-text">
                                            {option.text}
                                            <span className="poll-option-percentage">
                                                {`${option.percentage}%`}
                                            </span>
                                        </p>
                                        <hr />
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </li>
            );
        });
        return(
            <div className="poll-list">
                {loading}
                <ul>
                    {mappedPolls}
                </ul>
            </div>
        )

    }
}

export default PollList;