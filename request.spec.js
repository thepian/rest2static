const s1 = {
    "https://portalwebapi.swisslex.ch/api/Bibliothek/GetBibliothekPeriodicals?type=journals&language=1": {
      "method": "GET",
      "scan": [
        {
          "abbreviation": "abbreviation",
          "categorie": "categorie",
          "logoUrl": "logoUrl",
          "publisher": "publisher",
          "sinceYear": "sinceYear",
          "titles": [
            {
              "key": "key",
              "value": {
                "linkDisabled": "!",
                "title": "title"
              }
            }
          ] 
        }
      ],
      "template": "./src/site/fallback-book.hbs",
      "dist": "dist/de/biblio/casecollections/published/{{ key }}/index.html"
    }
  };

describe("Flatten", function() {
    it("");
});
