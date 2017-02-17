var indexer = require('level-indexer')
var isNumber = require('is-number')
var isArray = require('isarray')
var each = require('each-async')

module.exports = Indexer

function Indexer (db, opts) {
  if (!(this instanceof Indexer)) return new Indexer(db, opts)
  opts = opts || {}
  var self = this

  this.sep = opts.sep || '!'

  var indexOpts = {
    keys: opts.keys || true,
    values: opts.values || true,
    map: opts.map,
    sep: this.sep
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

Indexer.prototype.getIndex = function (key) {
  return this.indexes[Array.isArray(key) ? key.join('!') : key]
}

Indexer.prototype.find = function (index, opts, cb) {
  if (!this.getIndex(index)) throw new Error(index + ' index not found')

  return this.getIndex(index).find(opts, cb)
}

Indexer.prototype.findOne = function (index, opts, cb) {
  if (!this.getIndex(index)) return cb(new Error(index + ' index not found'))
  return this.getIndex(index).findOne(opts, cb)
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

  return each(Object.keys(this.indexes), iterator, cb)

  function iterator (key, i, next) {
    var modifications = []
    var keys = key.split(self.sep)
    var paths = keys.map(function (key) {
      return key.split('.')
    })

    var values = paths.map(function (path) {
      var current = obj
      path.forEach(function (pathItem) {
        current = current[pathItem]
      })
      return current
    })

    buildModifications(values)
    each(modifications, modifyIndex, next)

    function buildModifications (values) {
      var hasArray
      values.forEach(function (value, index) {
        if (!Array.isArray(value)) return
        hasArray = true
        value.forEach(function (item) {
          var subValues = values.slice()
          subValues[index] = item
          buildModifications(subValues)
        })
      })
      if (!hasArray) {
        modifications.push(values)
      }
    }

    function modifyIndex (values, i, cb) {
      var doc = {key: obj[self.keyName]}
      values.forEach(function (value, index) {
        doc[keys[index]] = value
      })
      self.getIndex(keys)[type](doc, cb)
    }
  }
}
