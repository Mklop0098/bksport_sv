'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'attributes', { type: 'text'}, function (err) {
    if (err) {
      console.error(`Error adding column attributes:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'attributes', function (err) {
    if (err) {
      console.error(`Error removing column attributes:`, err);
      return callback(err);
    }
    callback();
  });
};