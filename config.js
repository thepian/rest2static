var path = require('path');
var fs = require('fs');

module.exports = function getConfig(baseDir = process.cwd()) {
	var config = require(path.join(baseDir, 'package.json')).rest2static;

	if (typeof config === 'string') {
	    const content = fs.readFileSync(path.join(baseDir, config), { encoding: 'utf8'});
	    config = JSON.parse(content);
	}

	return config;
}