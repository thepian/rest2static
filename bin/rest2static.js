#!/usr/bin/env node

var ProgressBar = require('progress');
var request = require('request');
const plan = require('../plan');
const getConfig = require('../config');

const reqPlan = plan(getConfig(), request);

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
