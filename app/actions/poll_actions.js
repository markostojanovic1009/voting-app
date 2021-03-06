import {browserHistory} from 'react-router';

// Generates an HTTP request with fetch.
// Only for fetching polls.
// GET /api/polls
function sendRequest(route, token) {
    return (dispatch) => {
        dispatch({
            type: 'FETCH_POLLS',
        });
        return fetch(route, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        }).then((response) => {
            return response.json().then((json) => {
                if (response.ok) {
                    dispatch({
                        type: 'RECEIVE_POLLS_SUCCESS',
                        polls: Array.isArray(json) ? json : json.polls,
                        pageCount: json.pageCount
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

export function getPolls(pageNumber = 1, getPageCount = false) {
    return sendRequest(`/api/polls?page=${pageNumber}${getPageCount ? "&page_count" : ""}`);
}

export  function getPoll(pollId) {
    return sendRequest(`/api/poll/${pollId}`);
}

export function getUserPolls(user_id, token, pageNumber = 1, getPageCount = false) {
    return sendRequest(`/api/polls?user_id=${user_id}&page=${pageNumber}${getPageCount ? "&page_count" : ""}`, token);
}

// POST /api/poll/:poll_id
export function vote(pollId, pollOptionId, userId) {
    return (dispatch) => {
        if (pollOptionId) {
            return fetch(`/api/poll/${pollId}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    poll_option_id: pollOptionId,
                    user_id: userId
                })
            })
                .then((response) => {
                    if (response.ok) {
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
                        return null;
                    } else {
                        return response.json();
                    }
                })
                .then((json) => {
                    if (json) {
                        dispatch({
                            type: 'VOTE_FAILURE',
                            messages: Array.isArray(json) || [json]
                        });
                    }
                });
        } else {
            dispatch({
                type: 'VOTE_FAILURE',
                messages: [{
                    msg: 'Please select an option.'
                }]
            })
        }
    }
}

export function createPoll(title, options, userId, token) {
    return (dispatch) => {

        const errors = [];

        // Validate that title isn't empty
        if(!title.trim().length) {
            errors.push({
                msg: 'Title cannot be empty.'
            });
        }

        // Filter all empty options
        const filteredOptions = options.filter((option) => {
            return option.text.trim().length > 0;
        });

        if(!filteredOptions.length) {
            errors.push({
                msg: 'At least one option must be valid.'
            });
        }

        if(errors.length > 0) {
            return dispatch({
                type: 'CREATE_POLL_FAILURE',
                messages: errors
            })
        } else {
            return fetch('/api/polls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({title, options: filteredOptions, user_id: userId})
            }).then((response) => {
                return response.json().then((json) => {
                    if (response.ok) {
                        browserHistory.push(`/poll/${json.poll_id}`);
                    } else {
                        dispatch({
                            type: 'CREATE_POLL_FAILURE'
                        });
                    }
                });
            });
        }
    }
}

export function addOptions(poll_id, options, token) {

    const filteredOptions = options.filter((option) => {
        return option.text.length > 0;
    });

    return (dispatch) => {
        return fetch(`/api/poll/${poll_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({options: filteredOptions})
        }).then((response) => {
            return response.json().then((json) => {
                if(response.ok) {
                    dispatch({
                        type: 'UPDATE_POLL_SUCCESS',
                        messages: [{
                            msg: 'Poll updated successfully.'
                        }],
                        pollOptions: json
                    });
                } else {
                    dispatch({
                        type: 'UPDATE_POLL_FAILURE',
                        messages: Array.isArray(json) ? json : [json]
                    });
                }
            }).catch((error) => {
                console.log(error);
            });
        });
    }
}

export function deletePoll(poll_id, token) {
    return (dispatch) => {
        return fetch(`/api/poll/${poll_id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}`}
        }).then((response) => {
            if(response.ok) {
                browserHistory.push('/polls/my');
                dispatch({
                    type: 'DELETE_POLL_SUCCESS',
                    messages: [{
                        msg: 'Poll deleted successfully.'
                    }]
                });
            } else {
                response.json().then((json) => {
                    dispatch({
                        type: 'DELETE_POLL_FAILURE',
                        messages: Array.isArray(json) ? json : [json]
                    });
                });
            }
        });
    }
}