const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');
const flatten = require('./flatten');
const handlebars = require('handlebars');

module.exports = function plan(config, request) {
    const extraData = {};

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

    if (config.assets) {
        const assets = fs.readFileSync(config.assets);
        Object.assign(extraData, JSON.parse(assets));
    }

    return Object.keys(config).map(url => () => {
        const entry = config[url];

        if (url.startsWith('https:')) {
            const { method, dist, template } = entry;

            const handlebarsSource = fs.readFileSync(template, { encoding: 'utf8'});
            const templateFn = handlebars.compile(handlebarsSource);

            request.get(url, {}, (error, response, body) => {
                if (error) {
                  console.error('oops', error);
                }
                const json = JSON.parse(body);
                let flat = [];
                try {
                    flat = flatten(entry.scan, json);
                }
                catch(err) {
                    console.error(err.message, 'for', url);
                }
                function renderDist(vars) {
                    const base = dist.replace('{{ ','{{').replace(' }}','}}');
                    return Object.keys(vars).reduce((r, name) => r.replace(`{{${name}}}`, vars[name]), base);
                }
                // console.info(flat.map(u => ({ ...u, dist: renderDist(u), out: templateFn(u) })));
                flat.forEach(entry => {
                    const filepath = renderDist(entry);
                    const data = Object.assign({}, extraData, entry);
                    mkdirp.sync(path.dirname(filepath));
                    fs.writeFile(filepath, templateFn(data), { encoding: 'utf8'}, error => { if (error) console.error('failed to save', filepath, error); });
                });
            });
        }
    });

};
