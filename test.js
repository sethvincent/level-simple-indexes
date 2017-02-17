var test = require('tape')
var memdb = require('memdb')
var sublevel = require('subleveldown')
var createIndexer = require('./index')

test('index a property', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: ['title'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = { key: 'pizza', title: 'the best pizza' }
  db.put(data.key, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('title', 'the best pizza', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.key, 'pizza')
        t.end()
      })
    })
  })
})

test('find with callback', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: ['title'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data1 = { key: 'pizza', title: 'matching title' }
  var data2 = { key: 'more pizza', title: 'matching title' }

  db.put(data1.key, data1, function (err) {
    t.notOk(err)
    db.put(data2.key, data2, function (err) {
      t.notOk(err)
      indexer.addIndexes(data1, function (err) {
        t.notOk(err)
        indexer.addIndexes(data2, function (err) {
          t.notOk(err)
          indexer.find('title', 'matching title', function (err, results) {
            t.notOk(err)
            var keys = results.map(function (result) {
              return result.key
            }).sort()

            t.deepEqual(keys, ['more pizza', 'pizza'])
            t.end()
          })
        })
      })
    })
  })
})

test('index multiple properties', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: ['title', 'description', 'status'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = {
    key: 'pizza',
    title: 'ok pizza',
    description: 'some description',
    status: 'unpublished'
  }

  db.put(data.key, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('status', 'unpublished', function (err, first) {
        t.notOk(err)
        t.ok(first)
        t.equal(first.key, 'pizza')
        indexer.findOne('description', 'some description', function (err, second) {
          t.notOk(err)
          t.ok(second)
          t.equal(second.key, 'pizza')
          indexer.findOne('title', 'ok pizza', function (err, third) {
            t.notOk(err)
            t.ok(third)
            t.equal(third.key, 'pizza')
            t.end()
          })
        })
      })
    })
  })
})

test('index a property that is an object', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: ['metadata.title'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = {
    key: 'pizza',
    metadata: {
      title: 'the best pizza'
    }
  }

  db.put(data.key, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('metadata.title', 'the best pizza', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.key, 'pizza')
        t.end()
      })
    })
  })
})

test('index a property that is an array', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: ['ingredients'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = {
    key: 'pizza',
    ingredients: ['cheese', 'pepperoni', 'sauce']
  }

  db.put(data.key, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('ingredients', 'cheese', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.key, 'pizza')
        t.end()
      })
    })
  })
})

test('index deeply nested properties', function (t) {
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
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('ingredients.toppings.meat', 'sausage', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.key, 'pizza')
        t.end()
      })
    })
  })
})

test('remove indexes of deeply nested properties', function (t) {
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
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('ingredients.toppings.meat', 'sausage', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.key, 'pizza')
        indexer.removeIndexes(data, function () {
          indexer.findOne('ingredients.toppings.meat', 'sausage', function (err, noresult) {
            t.notOk(err)
            t.notOk(noresult)
            t.end()
          })
        })
      })
    })
  })
})

test('use a custom keyname', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    keyName: 'id',
    properties: ['title'],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = { id: 'pizza', title: 'the best pizza' }
  db.put(data.id, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function () {
      indexer.findOne('title', 'the best pizza', function (err, result) {
        t.notOk(err)
        t.ok(result)
        t.equal(result.id, 'pizza')
        t.end()
      })
    })
  })
})

test('index with multiple keys', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: [['title', 'description']],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data1 = { key: 'foo', title: 'pepperoni', description: 'very good' }
  var data2 = { key: 'bar', title: 'pineapple', description: 'also good' }
  db.put(data1.key, data1, function (err) {
    t.notOk(err)
    db.put(data2.key, data2, function (err) {
      t.notOk(err)
      indexer.addIndexes(data1, function (err) {
        t.notOk(err)
        indexer.addIndexes(data2, function (err) {
          t.notOk(err)

          indexer.findOne(['title', 'description'], ['pineapple', 'also good'], function (err, result) {
            t.notOk(err)
            t.equal(result.key, data2.key)
            t.end()
          })
        })
      })
    })
  })
})

test('index with multiple deep array keys', function (t) {
  var db = sublevel(memdb(), { valueEncoding: 'json' })
  var indexdb = sublevel(db, 'indexes')
  var indexer = createIndexer(indexdb, {
    properties: [['apple.seeds', 'can.beans']],
    map: function (key, next) {
      db.get(key, next)
    }
  })

  var data = {
    key: 'abc123',
    apple: {
      seeds: ['safe', 'poisonous']
    },
    can: {
      beans: ['pinto', 'garbonzo', 'green']
    }
  }

  t.plan(8)

  db.put(data.key, data, function (err) {
    t.notOk(err)
    indexer.addIndexes(data, function (err) {
      t.notOk(err)

      indexer.findOne(['apple.seeds', 'can.beans'], ['safe', 'pinto'], function (err, result) {
        t.notOk(err)
        t.equal(result.key, data.key)
      })
      indexer.findOne(['apple.seeds', 'can.beans'], ['poisonous', 'garbonzo'], function (err, result) {
        t.notOk(err)
        t.equal(result.key, data.key)
      })
      indexer.findOne(['apple.seeds', 'can.beans'], ['safe', 'green'], function (err, result) {
        t.notOk(err)
        t.equal(result.key, data.key)
      })
    })
  })
})
