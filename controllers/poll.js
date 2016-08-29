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
        console.log(poll);
        res.send(poll)
    }).catch((error) => {
        res.status(400).send(error);
    })

};