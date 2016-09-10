import React from 'react';
import {Link} from 'react-router';

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
class PollList extends React.Component {

    constructor() {
        super();
        this.state = {
            pageNumber: 1
        }
    }

    handlePageChange(nextPage) {
        console.log(nextPage);
        if(nextPage > 0 && nextPage <= this.props.polls.pageCount) {
            this.props.getPolls(nextPage);
            this.setState({pageNumber: nextPage});
        }
    }

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
                        <Link className="vote-now-button green-button" to={'/poll/' + item.pollId}>Vote now!</Link>
                    </div>
                    <div className="poll-options-wrapper">
                        <ul>
                            {item.options.map((option) => {
                                return(
                                    <li key={option.pollOptionId} className="poll-option-list-item">
                                        <p className="poll-option-text">
                                            {option.text}
                                            <span className="poll-option-percentage">
                                                {isNumeric(option.percentage) ? `${option.percentage}%`
                                                    : option.percentage}
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

        let nextPages = [];
        let previousPages = [];
        const currentPageNumber = this.state.pageNumber;
        const totalPageNumber = this.props.polls.pageCount;
        for(let i = 1; i <= 3; i++) {
            if(currentPageNumber + i <= totalPageNumber) {
                nextPages.push(
                    <li><a href="#" aria-label={`Page${currentPageNumber + i}`}
                           key={currentPageNumber + i}
                           onClick={this.handlePageChange.bind(this, (currentPageNumber + i))}>{currentPageNumber + i}</a></li>
                );
            } else if (currentPageNumber - i >= 1) {
                previousPages.push(
                    <li><a href="#" aria-label={`Page${currentPageNumber - i}`}
                           key={currentPageNumber - i}
                           onClick={this.handlePageChange.bind(this, (currentPageNumber - i))}>{currentPageNumber - i}</a></li>
                );
            }
        }

        return(
            <div>
                <div className="poll-list">
                    {loading}
                    <ul>
                        {mappedPolls}
                    </ul>
                </div>
                <div className="pagination-wrapper">
                    <ul className="pagination" role="navigation" aria-label="Pagination">
                        <li className='pagination-previous'>
                            <a href="#"
                               onClick={this.handlePageChange.bind(this, this.state.pageNumber - 1)}
                               className={this.state.pageNumber > 1 ? "" : "disabled" }
                               aria-label="Next page">Previous<span className="show-for-sr">page</span></a>
                        </li>
                        {previousPages}
                        <li className="current"><span className="show-for-sr">You're on page</span> {this.state.pageNumber}</li>
                        {nextPages}
                        <li className={`pagination-next`}>
                            <a href="#"
                               onClick={this.handlePageChange.bind(this, this.state.pageNumber + 1)}
                               className={this.state.pageNumber < totalPageNumber ? "" : "disabled" }
                               aria-label="Next page">Next<span className="show-for-sr">page</span></a>
                        </li>
                    </ul>
                </div>
            </div>
        );

    }
}

export default PollList;