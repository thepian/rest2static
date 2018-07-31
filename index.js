const config = require('./config');
const planImpl = require('./plan');
var request = require('request');

var exports = module.exports = {};

exports.plan = function plan() {
	return planImpl(config(), request);
};

