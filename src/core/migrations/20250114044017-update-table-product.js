'use strict';

exports.up = function (db, callback) {
  db.addColumn('product', 'notify', { type: 'text' }, callback);
  db.addColumn('product', 'is_authentic', { type: 'boolean', defaultValue: false }, callback);
  db.addColumn('product', 'is_freeship', { type: 'boolean', defaultValue: false }, callback);
  db.addColumn('product', 'can_return', { type: 'boolean', defaultValue: false }, callback);
};

exports.down = function (db, callback) {
  db.removeColumn('product', 'notify', callback);
  db.removeColumn('product', 'is_authentic', callback);
  db.removeColumn('product', 'is_freeship', callback);
  db.removeColumn('product', 'can_return', callback);
};