# level-simple-indexes

Create multiple indexes of data stored in a [levelup](http://npmjs.org/levelup) database using [level-indexer](http://npmjs.org/level-indexer).

## Installation

```
npm install --save level-simple-indexes
```

## Examples

### Basic usage

```js
var memdb = require('memdb')
var sublevel = require('subleveldown')
var createIndexer = require('./index')

var db = sublevel(memdb(), { valueEncoding: 'json' })
var indexdb = sublevel(db, 'indexes')

var indexer = createIndexer(indexdb, {
  properties: ['ingredients.sauce', 'ingredients.toppings.meat'],
  map: function (key, next) {
    db.get(key, next)
  }
})

var data = {
  key: 'pizza',
  ingredients: {
    sauce: 'tomato',
    toppings: {
      cheese: 'cheddar',
      meat: ['pepperoni', 'sausage'],
      vegetables: ['onion', 'bell pepper']
    }
  }
}

db.put(data.key, data, function (err) {
  if (err) console.log(err)
  indexer.addIndexes(data, function () {
    indexer.findOne('ingredients.toppings.meat', 'sausage', function (err, result) {
      if (err) console.log(err)
      console.log(result)
    })
  })
})

```

### Creating an index with multiple keys

```js
var memdb = require('memdb')
var sublevel = require('subleveldown')
var createIndexer = require('./index')

var db = sublevel(memdb(), { valueEncoding: 'json' })
var indexdb = sublevel(db, 'indexes')

var indexer = createIndexer(indexdb, {
  properties: [['title', 'description']],
  map: function (key, next) {
    db.get(key, next)
  }
})

var data = { key: 'foo', title: 'pepperoni', description: 'very good' }
db.put(data.key, data, function (err) {
  indexer.addIndexes(data, function () {
    indexer.findOne('title!description', data, function (err, result) {
      console.log(err, result)
    })
  })
})
```

## License
[MIT](LICENSE.md)