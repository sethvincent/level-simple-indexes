var indexer = require('level-indexer')
var isNumber = require('is-number')
var isArray = require('isarray')
var each = require('each-async')

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
  this.keyName = opts.keyName || 'key'

  this.indexes = {}
  opts.properties.forEach(function (key) {
    if (!Array.isArray(key)) {
      key = [key]
    }
    self.indexes[key.join('!')] = indexer(db, key, indexOpts)
  })
}

Indexer.prototype.find = function (index, opts, cb) {
  if (!this.indexes[index]) throw new Error(index + ' index not found')
  return this.indexes[index].find(opts, cb)
}

Indexer.prototype.findOne = function (index, opts, cb) {
  if (!this.indexes[index]) return cb(new Error(index + ' index not found'))
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
  each(keys, iterator, cb)

  function splitKeys (key) {
    if (isArray(key)) return key
    else {
      return key.split('.').map(function (key) {
        if (isNumber(key)) return parseInt(key)
        return key
      })
    }
  }

  function modify (key, value, cb) {
    var doc = { key: obj[self.keyName] }
    doc[key] = value
    self.indexes[key][type](doc, cb)
  }

  function iterator (key, i, next) {
    return loop(key, obj, null)

    function loop (key, data, keypath) {
      keypath = keypath || splitKeys(key)
      var current = keypath[0]
      if (keypath.length === 1) {
        if (isArray(data[current])) {
          each(data[current], function (item, i, done) {
            modify(key, item, done)
          }, next)
        } else {
          modify(key, data[current], next)
        }
      } else {
        return loop(key, data[current], keypath.slice(1))
      }
    }
  }
}
