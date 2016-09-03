import React from 'react';
import {connect} from 'react-redux';
const update = require('react-addons-update');
//import { createPoll } from '../../actions/poll_actions';

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

    addOptionsTextInput() {
        this.setState({
            options: update(this.state.options, {
                $push: [{
                    text: ''
                }]
            })
        });
    }


    render() {
        const mappedOptions = this.state.options.map((option, index) => {
            return (
                <input type="text" key={index} value={option.text}
                       className="poll-create-option-text"
                       placeholder="Option text..."
                       onChange={this.handleOptionTextChange.bind(this, index)} />
            )
        });
        return(
            <div>

                <div className="row">
                    <div className="small-12 medium-6 medium-offset-3 columns">
                        <p className="poll-create-header">Create a new poll</p>
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
                    <div className="small-9 medium-6 medium-offset-2 columns">
                        {mappedOptions}
                    </div>
                    <div className="small-2 medium-4 columns">
                        <button className="add-options-button"
                                onClick={this.addOptionsTextInput.bind(this)}>+</button>
                    </div>
                </div>

                <div className="row">
                    <div className="small-4 medium-3 medium-offset-2 columns">
                        <button className="create-poll-button">Create</button>
                    </div>
                </div>

            </div>
        )
    }

}

const mapStateToProps = (state) => {
    return {
        messages: state.messages,
    };
};

export default connect(mapStateToProps)(PollCreate);