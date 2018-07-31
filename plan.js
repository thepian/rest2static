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
    const tickers = []; // callbacks when progress is made

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

    function tick(data) {
        tickers.forEach(ticker => ticker(data));
    }

    const requestors = Object.keys(config).filter(restUrl => restUrl.startsWith('https:')).map((restUrl,indexRequest) => {
        const { method, url:urlTemplate, template, scan, name } = config[restUrl];
        const handlebarsSource = fs.readFileSync(template, { encoding: 'utf8'});
        const templateFn = handlebars.compile(handlebarsSource);

        return {
            name,
            restUrl,
            urlTemplate,
            templateFn,

            reloadTemplate() {
              const handlebarsSource = fs.readFileSync(template, { encoding: 'utf8'});
              this.templateFn = handlebars.compile(handlebarsSource);
            },

            fetchAndGenerate() {
              awaiting.push(
                new Promise((resolve, reject) => {
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
                            fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, 
                              error => { 
                                  if (error) console.error('failed to save', filepath, error); 
                                  //TODO completed promise array
                              });
                        });
                        tick({ progress: indexRequest+1, msg: name||restUrl });
                        resolve(flat);
                    }
                    catch(err) {
                        reject(err);
                        console.error(err.message, 'for', restUrl);
                        // console.error(err); bar.interrupt()
                    }
                  });
              }));
            }
        };
    });

    return {
      requestors,
      total: requestors.length + 3,
      pages,
      awaiting,

      set ticker(ticker) {
        tickers.push(ticker);
      },

      renderMock(url, mockData) {
          const requestor = requestors.find(r => r.urlTemplate.startsWith(url));
          requestor.reloadTemplate();
          const loc = renderLocation(requestor.urlTemplate, requestor);
          const data = Object.assign(loc, extraData, mockData || config.mock);
          const content = requestor.templateFn(data);
          return content; // `Oops, not there yet.`;
      },

      makePages() {
        requestors.forEach(req => req.fetchAndGenerate())
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
            fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, 
                error => { 
                    if (error) console.error('failed to save', filepath, error); 
                    tick({ progress: 1, msg: 'Sitemap.' });
                });
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
            fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, 
                error => { 
                    if (error) console.error('failed to save', filepath, error); 
                    tick({ progress: 1, msg: 'Index.' });
                });
          });
        }
      }
    };
};
