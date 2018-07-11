## REST -> Static

A simple way to add static pages to your website by generating them from a REST API call(or many).
If your website is done as a Web App for qualified users, you might still want to expose some of the
content within as public web pages.

So as part of your build process, you pull data from REST API and generate static HTML content using
Handlebars templates.

Put a configuration in your `package.json`.
```
{
  "scripts": {
    "generate": "rest2static"
  },
  "rest2static": {
    "root": "./dist",
    "partials": "./src",
    "https://...": {
      "method": "GET",
      "scan": [
        {
          "key": "key",
          "title": "title"
        }
      ],
      "template": "./src/template.hbs",
      "url": "/lib/{{ key }}/"
    }
  }
}
```

You can now run `npm run generate` to pull down and generate from the URL you've defined in the configuration.


### Configuration

The configuration can be embedded in `package.json` or put in a separate file. By default `rest2static` will look up the entry in `package.json`. It expects a string or an object. Specify a string with the config file name
relative to the project directory if you want to keep a separate config file.

[TODO: You can use multiple configurations by passing the path to the config file as a parameter to the command.]
[TODO: In addition to `.json` format, you write the config file as a `.config.js` file. In this case it must be a valid node module that exports the config object.]


`root` The document root where sitemap and pages are written to.
`index`
`sitemap` changefreq.
`partials`
`helpers`
`assets`

`method`
`scan`
`template`
`url`


### REST Data -> Page

When rendering a page the template is combined with a flat set of data. All string values in the `scan` object graph are treated as the name under which they are found in the data passed to the template. If you want a field to exist under more than one name, provide both names separated by space. If you want a default value append `=` followed by the default value. The location of the page can also be found in the data as `filepath` and `url`.

If an `assets` file is declared, the contents are provided as data to the page as well.


### assets integration

If you use webpack to generate the main site files, the bundles will probably gain a unique name in production builds. So the URLs for CSS and JS resources keep changing. You can use npm `assets-webpack-plugin` module to export the bundle names to a JSON file. The URLs can then be included in the rest2static generation by declaring `assets` in the config file.


### Debugging

As a not VS Code has pretty decent debugging support. As an example here is the launch.json for debugging the tests.

```JSON
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Specs",
            "program": "${workspaceRoot}/node_modules/jasmine/bin/jasmine.js",
            "args": [
                "${workspaceFolder}/flatten.spec.js"
            ],
            "env": {
                "NODE_PATH": "."
            }
        }
    ]
```