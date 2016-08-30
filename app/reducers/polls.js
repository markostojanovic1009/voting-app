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
        case 'VOTE_SUCCESS':
            return Object.assign({}, state, {
                items: state.items.map((item) => {
                    if(item.id === action.poll.id) {
                        return {
                            ...item,
                            total: item.total + 1,
                            options: item.options.map((option) => {
                                if(option.poll_option_id == action.poll.option.id) {
                                    return {
                                        ...option,
                                        count: option.count + 1
                                    };
                                } else {
                                    return option;
                                }
                            })
                        }
                    } else {
                        return item;
                    }
                })
            });
        case 'VOTE_FAILURE':
            return Object.assign({}, state);
        default:
            return initialState;
    }
}