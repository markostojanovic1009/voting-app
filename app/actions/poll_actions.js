function sendRequest(route, method) {
    return (dispatch) => {
        dispatch({
            type: 'FETCH_POLLS',
        });
        return fetch(route, {
                method: method || 'GET'
            })
            .then((response) => {
                return response.json().then((json) => {
                    if (response.ok) {
                        dispatch({
                            type: 'RECEIVE_POLLS_SUCCESS',
                            polls: json
                        });
                    } else {
                        dispatch({
                            type: 'RECEIVE_POLLS_FAILURE',
                            messages: Array.isArray(json) ? json : [json]
                        });
                    }
                });
            })
    };
}

export function getAllPolls() {
    return sendRequest('/api/polls');
}

export  function getPoll(pollId) {
    return sendRequest(`/api/poll/${pollId}`);
}

export function vote(pollId, pollOptionId, userId) {
    return (dispatch) => {
        return fetch(`/api/poll/${pollId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                    poll_option_id: pollOptionId,
                    user_id: userId
                })
            })
            .then((response) => {
                if(response.ok) {
                    dispatch({
                        type: 'VOTE_SUCCESS',
                        poll: {
                            id: pollId,
                            option: {
                                id: pollOptionId
                            }
                        },
                        messages: [{
                            msg: 'Thank you for voting.'
                        }]
                    });
                } else {
                    return response.json();
                }
            })
            .then((json) => {
                console.log(json);
                if(json) {
                    dispatch({
                        type: 'VOTE_FAILURE',
                        messages: Array.isArray(json) || [json]
                    });
                }
            });
    };
}