function sendRequest(route) {
    return (dispatch) => {
        dispatch({
            type: 'FETCH_POLLS'
        });
        return fetch(route)
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
                            msg: Array.isArray(json) ? json : [json]
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