const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const flatten = require('./flatten');
const handlebars = require('handlebars');

module.exports = function plan(config, request) {
    const extraData = {};
    let root = ".";
    let pages = []; // pages generated
    let awaiting = []; // promises for requests to complete

    if (config.partials) {
        const names = fs.readdirSync(config.partials).filter(name => name.endsWith('.hbs') || name.endsWith('.handlebars'));
        names.forEach(name => {
            const partial = fs.readFileSync(path.join(config.partials, name), { encoding: 'utf8'});
            handlebars.registerPartial(name.replace('.hbs','').replace('.handlebars',''), partial);
        });
    }

    if (config.helpers) {
        const names = fs.readdirSync(config.helpers).filter(name => name.endsWith('.hbs') || name.endsWith('.handlebars'));
        names.forEach(name => {
            const helper = fs.readFileSync(path.join(config.helpers, name), { encoding: 'utf8'});
            handlebars.registerHelper(name.replace('.hbs','').replace('.handlebars',''), helper);
        });
    }

    if (config.decorators) {
        const names = fs.readdirSync(config.decorators).filter(name => name.endsWith('.hbs') || name.endsWith('.handlebars'));
        names.forEach(name => {
            const decorator = fs.readFileSync(path.join(config.decorators, name), { encoding: 'utf8'});
            handlebars.registerDecorator(name.replace('.hbs','').replace('.handlebars',''), decorator);
        });
    }

    // Document Root where pages are saved
    if (config.root) {
      root = config.root;
    }

    if (config.assets) {
        const assets = fs.readFileSync(config.assets);
        Object.assign(extraData, JSON.parse(assets));
    }

    function renderLocation(url, vars) {
        const base = url.replace('{{ ','{{').replace(' }}','}}');
        const expanded = Object.keys(vars).reduce((r, name) => r.replace(`{{${name}}}`, vars[name]), base);
        const filepath = (expanded.endsWith('.html') || expanded.endsWith('.xml'))
            ? path.join(root, expanded) : path.join(root, expanded, 'index.html');
        return { filepath, url: expanded };
    }

    const requestors = Object.keys(config).filter(restUrl => restUrl.startsWith('https:')).map(restUrl => {
        const { method, url:urlTemplate, template, scan } = config[restUrl];
        const handlebarsSource = fs.readFileSync(template, { encoding: 'utf8'});
        const templateFn = handlebars.compile(handlebarsSource);

        return function fetchAndGenerate() {
            awaiting.push(new Promise((resolve, reject) => {
              request.get(restUrl, {}, (error, response, body) => {
                  if (error) {
                    console.error('oops', error);
                  }
                  const json = JSON.parse(body);
                  try {
                      const flat = flatten(scan, json);
                      flat.forEach(entry => {
                          const {filepath,url} = renderLocation(urlTemplate, entry);
                          const data = Object.assign({filepath,url}, extraData, entry);
                          pages.push(data);
                          mkdirp.sync(path.dirname(filepath));
                          fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, error => { if (error) console.error('failed to save', filepath, error); });
                      });
                      resolve(flat);
                  }
                  catch(err) {
                      reject(err);
                      console.error(err.message, 'for', restUrl);
                      // console.error(err);
                  }
              });
            }));
        };
    });

    return {
      requestors,
      pages,
      awaiting,

      makePages() {
        requestors.forEach(req => req())
      },

      makeSitemap() {
        if (config.sitemap) {
          Promise.all(awaiting).then(() => {
            const changefreq = config.sitemap.changefreq || 'weekly';
            const handlebarsSource = fs.readFileSync(config.sitemap.template, { encoding: 'utf8'});
            const templateFn = handlebars.compile(handlebarsSource);
            const {filepath,url} = renderLocation(config.sitemap.url, {});
            const data = Object.assign({filepath,url,pages,changefreq}, extraData);
            mkdirp.sync(path.dirname(filepath));
            fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, error => { if (error) console.error('failed to save', filepath, error); });
          });
        }
      },

      makeIndex() {
        if (config.index) {
          Promise.all(awaiting).then(() => {
          const handlebarsSource = fs.readFileSync(config.index.template, { encoding: 'utf8'});
          const templateFn = handlebars.compile(handlebarsSource);
          const {filepath,url} = renderLocation(config.index.url, {});
          const data = Object.assign({filepath,url,pages}, extraData);
          mkdirp.sync(path.dirname(filepath));
          fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, error => { if (error) console.error('failed to save', filepath, error); });
          });
        }
      }
    };
};
