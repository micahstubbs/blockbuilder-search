// Standalone host for blockbuilder-search (historically mounted inside
// blockbuilder). Serves the search page, static bundle, and the
// Elasticsearch-backed API at the /search base path the UI expects.
const express = require("express");
const app = express();

const bbSearch = require("./index.js")(
  { host: process.env.ES_HOST || "localhost:9200" },
  app,
  process.env.GA_ID || ""
);

app.get("/", (req, res) => res.redirect("/search"));
app.get("/search", bbSearch.page);
app.get("/search/api/search", bbSearch.api);
app.get("/search/api/aggregateD3API", bbSearch.aggregateD3API);
app.get("/search/api/aggregateD3Modules", bbSearch.aggregateD3Modules);
// legacy paths used when mounted inside blockbuilder
app.get("/api/search", bbSearch.api);
app.get("/api/aggregateD3api", bbSearch.aggregateD3API);
app.get("/api/aggregateD3modules", bbSearch.aggregateD3Modules);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`blockbuilder-search listening on ${PORT}`));
