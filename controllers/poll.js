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

/**
 * GET /api/polls.
 * It no query parameters are passed, it returns an array of polls
 * in the following format:
 *  {
 *      pollId,
 *      options: [{
 *          pollOptionId,
 *          text,
 *          percentage
 *     }],
 *     title
 *  }
 *
 * Accepts query parameters user_id, page and page_count.
 *
 * If user_id is passed, it filters queries that were made by the
 * user with this user_id.
 *
 * If page is passed, it returns the particular page of results.
 * Defaults to 1. Returns 10 polls per page.
 *
 * If page_count is passed(as any non-undefined value), returns
 * pageCount, which is the total number of pages for returned result.
 */
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

/**
 * POST /api/polls
 * Creates a poll, then adds poll options.
 * Receives userId, title and options array from req.body
 */
exports.createPoll = function(req, res) {

    let newPollId = null;

    if(!req.body.options.length)
        res.status(400).send({
            msg: 'At least one option must be valid.'
        });

    Poll.createPoll(req.body.user_id, req.body.title).then((poll) => {
        newPollId = poll.id;
        return Poll.addPollOptions(poll.id, req.body.options);
    }).then(() => {
        res.status(200).send({poll_id: newPollId});
    }).catch((error) => {
        res.status(400).send(error);
    });
};

/**
 * GET /api/poll/:poll_id
 * Returns aggregated votes for the poll.
 */
exports.getPollVotes = function (req, res) {

    const poll_id = req.params.poll_id;

    if(!Number.isInteger(parseInt(poll_id))) {
        res.status(400).send({
            msg: "Parameter must be an integer."
        });
    }

    Poll.getPollVotes(poll_id).then((poll) => {
        res.send(poll);
    }).catch((error) => {
        res.status(400).send(error);
    })

};

/**
 * POST /api/poll/:poll_id
 * Allows the user to vote for the poll.
 * Receives user_id
 * IP address is saved for both registered and
 * unregistered users.
 */
exports.vote = function (req, res) {
    const poll_id = req.params.poll_id;
    const { user_id, poll_option_id } = req.body;

    if(!poll_option_id) {
        res.status(400).send({
            msg: 'poll_option_id missing.'
        });
    }

    Poll.voteFor(poll_id, poll_option_id, user_id || null, req.ip).then(() => {
        res.sendStatus(200);
    }).catch((error) => {
        res.status(400).send(error);
    });

};

/**
 * PUT /api/poll/:poll_id
 */
exports.updatePoll = function (req, res) {

    const poll_id = req.params.poll_id;
    const options = req.body.options;

    if(!options.length)
        res.status(400).send({
            msg: 'Include at least one option.'
        });

    options.forEach((option) => {
        if(!option.text || option.text.trim().length == 0)
            res.status(400).send({
                msg: 'An option cannot empty.'
            });
    });

    verifyUserAccess(poll_id, req.user.id).then(() => {
        return Poll.addPollOptions(poll_id, options)
    }).then((pollOptions) => {
        res.status(200).send(pollOptions);
    }).catch((error) => {
        if(error.code === 401)
            res.status(401).send({msg: 'Unauthorized.'});
        res.status(400).send(error);
    });
};

/**
 * DELETE /api/poll/:poll_id
 */
exports.deletePoll = function (req, res) {

    const poll_id = req.params.poll_id;

    verifyUserAccess(poll_id, req.user.id).then(() => {
        return Poll.deletePoll(poll_id);
    }).then(() => {
        res.sendStatus(204);
    }).catch((error) => {
        if(error.code === 401)
            res.status(401).send({msg: 'Unauthorized.'});
        res.status(400).send(error);
    });
};