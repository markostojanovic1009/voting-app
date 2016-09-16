import React from 'react';
import {connect} from 'react-redux';
const update = require('react-addons-update');
import { createPoll } from '../../actions/poll_actions';
import Messages from '../Messages';

class PollCreate extends React.Component {

    constructor() {
        super();
        this.state = {
            title: '',
            options: [{
                text: ''
            }]
        }
    }

    handleTitleChange(event) {
        this.setState({ title: event.target.value });
    }

    // Changes the input field value of option with
    // this index.
    handleOptionTextChange(index, event) {
        this.setState({
            options: update( this.state.options, {
                [index]: {
                    $set: {
                        text: event.target.value
                    }
                }
            })
        });
    }

    // Adds an additional text field for the additional
    // option.
    addOptionsTextInput() {
        this.setState({
            options: update(this.state.options, {
                $push: [{
                    text: ''
                }]
            })
        });
    }

    createButtonClick(auth) {
        const userId = auth.user ? auth.user.id : null;
        const token = auth.token;
        this.props.dispatch(createPoll(this.state.title, this.state.options, userId, token ));
    }


    render() {

        // Maps poll options to text fields.
        const mappedOptions = this.state.options.map((option, index) => {
            return (
                <div className="small-9 medium-6 medium-offset-2 columns">
                    <input type="text" key={index} value={option.text}
                           className="poll-create-option-text"
                           placeholder="Option text..."
                           onChange={this.handleOptionTextChange.bind(this, index)} />
                </div>
            )
        });


        return(
            <div>

                <div className="row">
                    <div className="small-12 medium-6 medium-offset-3 columns">
                        <h2 className="poll-header">Create a new poll</h2>
                    </div>
                </div>

                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2 columns">
                        <input type="text" className="poll-create-title" value={this.state.title}
                               placeholder="Poll title"
                               onChange={this.handleTitleChange.bind(this)} />
                    </div>
                </div>

                <div className="row">
                    {mappedOptions}
                    <div className="small-2 medium-4 columns">
                        <button className="add-options-button"
                                onClick={this.addOptionsTextInput.bind(this)}>+</button>
                    </div>
                </div>


                <div className="row">
                    <div className="small-12 medium-8 medium-offset-2 columns">
                        <button className="create-poll-button green-button"
                            onClick={this.createButtonClick.bind(this, this.props.auth)}>Create</button>
                    </div>
                </div>

                <div className="row">
                    <div className="small-12 medium-4 medium-offset-2">
                        <Messages messages={this.props.messages} />
                    </div>
                </div>

            </div>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        messages: state.messages,
        auth: state.auth
    };
};

export default connect(mapStateToProps)(PollCreate);