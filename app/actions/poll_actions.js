export function getAllPolls() {
    return (dispatch) => {
        dispatch({
            type: 'FETCH_POLLS',
        });
        return fetch('/api/polls')
            .then((response) => {
                console.log(response);
                return response.json().then((json) => {
                    if(response.ok) {
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
            });
    }
}