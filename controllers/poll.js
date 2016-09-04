import Poll from '../models/Poll';

exports.getAllPolls = function(req, res) {
    Poll.getAllPolls().then((polls) => {
        res.send(polls);
    }).catch((error) => {
        res.status(400).send(error);
    });
};

exports.getPoll = function (req, res) {

    const poll_id = req.params.poll_id;
    if(!Number.isInteger(parseInt(poll_id))) {
        res.status(400).send({
            msg: "Parameter must be an integer."
        });
    }

    Poll.getPollVotes(poll_id).then((poll) => {
        res.send(poll)
    }).catch((error) => {
        res.status(400).send(error);
    })

};

exports.vote = function (req, res) {
    const poll_id = req.params.poll_id;
    const { user_id, poll_option_id } = req.body;

    if(!poll_option_id) {
        res.status(400).send({
            msg: 'poll_option_id missing.'
        });
    }

    Poll.voteFor(poll_id, poll_option_id, user_id, req.ip).then(() => {
        res.sendStatus(200);
    }).catch((error) => {
        res.status(400).send(error);
    });

};

exports.createPoll = function(req, res) {
    let newPollId = null;
    Poll.createPoll(req.body.userId, req.body.title).then((poll) => {
        newPollId = poll.id;
        return Poll.addPollOptions(poll.id, req.body.options);
    }).then((pollOptions) => {
        res.status(200).send({poll_id: newPollId});
    }).catch((error) => {
        console.log(error);
        res.status(400).send(error);
    });
};

exports.updatePoll = function (req, res) {
    const poll_id = req.params.poll_id;
    const options = req.body.options;
    Poll.addPollOptions(poll_id, options).then((pollOptions) => {
        console.log(pollOptions);
        res.status(200).send(pollOptions);
    }).catch((error) => {
        console.log(error);
        res.status(400).send(error);
    });
};