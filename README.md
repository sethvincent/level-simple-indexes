# level-simple-indexes

Create multiple indexes of data stored in a [levelup](http://npmjs.org/levelup) database using [level-indexer](http://npmjs.org/level-indexer).

## Installation

```
npm install --save level-simple-indexes
```

## Example

```js
var memdb = require('memdb')
var sublevel = require('subleveldown')
var createIndexer = require('level-simple-indexes')

var db = sublevel(memdb(), { valueEncoding: 'json' })
var indexdb = sublevel(db, 'indexes')
var indexer = createIndexer(indexdb, {
  // keyName: 'key' <-- optional way to override which attribute in `data` is the key
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
  indexer.addIndexes(data, function () {
    indexer.findOne('ingredients.toppings.meat', 'sausage', function (err, result) {
      console.log(result)
    })
  })
})
```

## License
[MIT](LICENSE.md)