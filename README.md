# blockbuilder-search
API endpoint and UI for blockbuilder search page

This repo is split into two main parts, the API endpoint and the search page. It is currently only really designed
to be called from within blockbuilder, in order to develop a potentially complicated feature that has new backend requirements. 

# API endpoint
This is an express endpoint which calls ElasticSearch and returns the results.

# Search page
This is a small react app using redux.

# Development

### setup blockbuilder dev environment

Follow the [full dev setup guide](https://github.com/enjalot/blockbuilder/wiki/Development#development) at the **blockbuilder** code-editor project

Once you've done that, verify that it worked by opening a web browser and visiting local blockbuilder at [http://[::]:8889](http://[::]:8889)

### setup search index backend

Follow the steps in the [Setup Elasticsearch & Index some Gists](https://github.com/enjalot/blockbuilder-search-index#setup-elasticsearch--index-some-gists) section of the **blockbuilder-search-index** project

These steps guide us through setting up, installing, and running a local Elasticsearch instance that we can populate with blocks.  The blocks data is retrieved from Github and stored as static json files, before being loaded into our Elasticsearch index.  Once our search index is up, running, and populated, we're reading to query it with a web ui. 

### connect local blockbuilder with local blockbuilder-search

we'll use [npm link](https://docs.npmjs.com/cli/link) to make sure that **blockbuilder** always shows the latest local build of the **blockbuilder-search** UI. this is a one-time setup step. 

```
cd blockbuilder-search
npm link
cd ../blockbuilder
npm link blockbuilder-search
```

### Watch the **blockbuilder-search** source for changes...

...and rebuild the bundle on each change.  [npm link](https://docs.npmjs.com/cli/link) will make sure that those changes propogate to the **blockbuilder** project.

```
cd blockbuilder-search
npm run buildWatch
```

### 🎉

Now we can open a web browser and visit local blockbuilder search [http://[::]:8889/search](http://[::]:8889/search)