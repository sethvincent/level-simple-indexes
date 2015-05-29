var indexer = require('level-indexer')
var isArray = require('isarray')
var each = require('each-async')
var clone = require('clone')

module.exports = Indexer

function Indexer (db, opts) {
  if (!(this instanceof Indexer)) return new Indexer(db, opts)
  opts = opts || {}
  var self = this

  var indexOpts = {
    keys: opts.keys || true, 
    values: opts.values || true,
    map: opts.map
  }

  this.indexes = {}
  opts.properties.forEach(function (key) {
    self.indexes[key] = indexer(db, [key], indexOpts)
  })
}

Indexer.prototype.find = function (index, opts) {
  return this.indexes[index].find(opts)
}

Indexer.prototype.findOne = function (index, opts, cb) {
  return this.indexes[index].findOne(opts, cb)
}

Indexer.prototype.addIndexes = function (obj, cb) {
  this.modifyIndexes('add', obj, cb)
}

Indexer.prototype.removeIndexes = function (obj, cb) {
  this.modifyIndexes('remove', obj, cb)
}

Indexer.prototype.updateIndexes = function (obj, cb) {
  var self = this
  this.removeIndexes(obj, function () {
    self.addIndexes(obj, cb)
  })
}

Indexer.prototype.modifyIndexes = function (type, obj, cb) {
  var self = this
  var keys = Object.keys(this.indexes)
  each(keys, iterator, end)

  function iterator (key, i, next) {
    if (typeof obj[key] === 'string' || typeof obj[key] === 'boolean') {
      self.indexes[key][type](obj)
      next()
    }

    else if (isArray(obj[key])) {
      each(obj[key], function (item, i, done) {
        var data = clone(obj)
        data[key] = item
        self.indexes[key][type](data)
        done()
      }, function () {
        next()
      })
    }

    else if (obj[key] && typeof(obj[key]) === 'object') {
      var properties = Object.keys(obj[key])
      if (!properties.length) return next()

      each(properties, function (item, i, done) {
        var data = clone(obj)
        data[key] = item
        self.indexes[key][type](data)
        done()
      }, function () {
        next()
      })
    }

    else next()
  }

  function end () {
    if (cb) cb()
  }
}
