import Poll from '../models/Poll';

// Verifies that the poll belongs to the user before
// allowing him to delete or modify the poll.
function verifyUserAccess(poll_id, user_id) {
    return new Promise((resolve, reject) => {
        Poll.getPollOwner(poll_id).then((owner_id) => {
            if (owner_id === user_id)
                resolve();
            else
                reject({
                    code: 401
                });
        }).catch((error) => {
            reject(error);
        });
    });
}

exports.getPolls = function(req, res) {

    const user_id = req.query.user_id;
    const pageNumber = req.query.page;
    const getPageCount = req.query.page_count;

    Poll.getPolls(user_id, pageNumber).then((polls) => {
        if(getPageCount != undefined) {
            Poll.getPollPageCount(user_id).then((result) => {
                res.send({pageCount: result, polls});
            }).catch((error) => {
                res.status(400).send(error);
            });
        } else {
            res.send(polls);
        }
    }).catch((error) => {
        res.status(400).send(error);
    });

};

exports.getPollVotes = function (req, res) {

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
    }).then(() => {
        res.status(200).send({poll_id: newPollId});
    }).catch((error) => {
        res.status(400).send(error);
    });
};

exports.updatePoll = function (req, res) {

    const poll_id = req.params.poll_id;
    const options = req.body.options;

    verifyUserAccess(poll_id, req.user.id).then(() => {
        Poll.addPollOptions(poll_id, options)
    }).then((pollOptions) => {
        res.status(200).send(pollOptions);
    }).catch((error) => {
        res.status(400).send(error);
    });
};

exports.deletePoll = function (req, res) {

    const poll_id = req.params.poll_id;

    verifyUserAccess(poll_id, req.user.id).then(() => {
        return Poll.deletePoll(poll_id);
    }).then(() => {
        res.sendStatus(204);
    }).catch((error) => {
        if(error.code === 401)
            res.status(401).send({msg: 'Unauthorized'});
        res.status(400).send(error);
    });
};