const initialState = {
    isFetching: false,
    items: []
};

export default function polls(state = initialState, action) {
    switch(action.type) {
        case 'FETCH_POLLS':
            return Object.assign({}, state, { isFetching: true });
        case 'RECEIVE_POLLS_SUCCESS':
            return Object.assign({}, state, { isFetching: false, items: action.polls.slice() });
        default:
            return initialState;
    }
}