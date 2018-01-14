// queries that we can paste into Kibana devtools for debugging

// keyword search for `light`
GET _search
{
  "query": {
    "dis_max": {
      "queries": [
        {
          "match": {
            "description": "light"
          }
        },
        {
          "match": {
            "readme": "light"
          }
        },
        {
          "match": {
            "code": "light"
          }
        }
      ],
      "tie_breaker": 0.1
    }
  },
  "size": "100"
}

// all the blocks with thumbnails
GET _search
{
  "query": {
    "wildcard": {
      "filenames": "thumbnail.png"
    }
  }
}

// filter query
GET _search
{
  "query": {
    "bool" : {
      "must" : {
        "term" : { "user" : "kimchy" }
      },
      "filter": {
        "term" : { "tag" : "tech" }
      },
      "must_not" : {
        "range" : {
          "age" : { "gte" : 10, "lte" : 20 }
        }
      },
      "should" : [
        { "term" : { "tag" : "wow" } },
        { "term" : { "tag" : "elasticsearch" } }
      ],
      "minimum_should_match" : 1,
      "boost" : 1.0
    }
  }
}

// keyword search for `light`, only results with thumbnails
GET _search
{
  "query": {
    "dis_max": {
      "queries": [
        {
          "match": {
            "description": "light"
          },

        },
        {
          "match": {
            "readme": "light"
          }
        },
        {
          "match": {
            "code": "light"
          }
        }
      ],
      "tie_breaker": 0.1
    }
  },
  "size": "100"
}
