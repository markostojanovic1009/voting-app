import React from 'react';

class PollList extends React.Component {
    render() {
        const loading = this.props.polls.isFetching ?
            <div>
                Loading...
            </div> : null;
        const mappedPolls = this.props.polls.items.map((item) => {
            return (
                <li key={item.id}>
                    <p>Poll id: {item.id}</p>
                    <p>Poll title: {item.title}</p>
                </li>
            );
        });
        return(
            <div>
                {loading}
                <ul>
                    {mappedPolls}
                </ul>
            </div>
        )

    }
}

export default PollList;