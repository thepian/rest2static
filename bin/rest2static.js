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
reqPlan.makePages();
reqPlan.makeSitemap();
reqPlan.makeIndex();
console.log('\n');

//TODO progressbar
//TODO prefixing URLs "url": "url{'prefix':'https://portalwebapi.swisslex.ch/'}"
//TODO parse error details
//TODO plan testing
//TODO component / route for static pages, route redirect or manual? login needed. Redirect if already logged in
//TODO document SEO principle
//TODO integrated production build
//TODO document howto static-generate
//TODO extracted base style
//TODO multilang URLs
//TODO responsive layout
//TODO performance audit
//TODO server mapping dist/de dist/fr
//TODO page in line with frontpage