## REST -> Static

Pull data from REST API and generate static HTML content.

Put a configuration in your `package.json`.
```
{
  "scripts": {
    "generate": "rest2static"
  },
  "rest2static": {
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
      "dist": "dist/lib/{{ key }}/index.html"
    }
  }
}
```

You can now run `npm run generate` to pull down and generate from the URL you've defined in the configuration.
