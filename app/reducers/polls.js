const initialState = {
    isFetching: false,
    items: [],
    pageCount: 0
};

export default function polls(state = initialState, action) {
    switch(action.type) {

        case 'FETCH_POLLS':
            return Object.assign({}, state, { isFetching: true });

        case 'RECEIVE_POLLS_SUCCESS':
            return Object.assign({}, state, {
                isFetching: false,
                items: action.polls.slice(),
                pageCount: action.pageCount || state.pageCount // If new page count is received, update it
            });

        case 'VOTE_SUCCESS':
            return Object.assign({}, state, {
                items: state.items.map((item) => {

                    // Add one to poll total count and to option vote count
                    // for the poll/option which the user voted for.
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

        case 'UPDATE_POLL_SUCCESS':

            const formattedOptions = action.pollOptions.map((option) => {
                return {
                    text: option.text,
                    poll_option_id: option.id,
                    count: 0
                }
            });

            // Adds additional options.
            return Object.assign({}, state, {
                items: state.items.map((item) => {
                    return {
                        ...item,
                        options: [...item.options, ...formattedOptions]
                    };
                })
            });

        case 'VOTE_FAILURE':
            return Object.assign({}, state);

        default:
            return initialState;
    }
}