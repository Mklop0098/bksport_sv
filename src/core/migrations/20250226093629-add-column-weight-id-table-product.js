'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'weight_id', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column weight_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'weight_id', function (err) {
    if (err) {
      console.error(`Error removing column weight_id:`, err);
      return callback(err);
    }
    callback();
  });
};