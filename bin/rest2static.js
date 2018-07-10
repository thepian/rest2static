#!/usr/bin/env node

var path = require('path');
var fs = require('fs');
var ProgressBar = require('progress');
var config = require(path.join(process.cwd(), 'package.json')).rest2static;
// var config = requre('./package.json')
var request = require('request');
const plan = require('../plan');

if (typeof config === 'string') {
    const content = fs.readFileSync(path.join(process.cwd(), config), { encoding: 'utf8'});
    config = JSON.parse(content);
}

const reqPlan = plan(config, request);


var bar = new ProgressBar('Fetching data [:bar] :rate/bps :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: 10
});
bar.tick(0);
reqPlan.forEach(req => req());
console.log('\n');
