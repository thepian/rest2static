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


var bar = new ProgressBar('Generating site [:bar] :percent', { //  :rate/bps  :etas
  complete: '=',
  incomplete: ' ',
  width: 20,
  total: reqPlan.total
});
bar.tick(0);
reqPlan.ticker = (data) => {
  if (data.msg) {
    bar.interrupt(data.msg);
  }
  if (data.progress) {
    bar.tick();
  }
};
reqPlan.makePages();
reqPlan.makeSitemap();
reqPlan.makeIndex();

//TODO prefixing URLs "url": "url{'prefix':'https://portalwebapi.swisslex.ch/'}"
//TODO parse error details
