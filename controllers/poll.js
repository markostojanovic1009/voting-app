import Poll from '../models/Poll';

exports.getAllPolls = function(req, res) {
    Poll.getAllPolls().then((polls) => {
        res.send(polls);
    }).catch((error) => {
        res.status(400).send(error);
    });
};