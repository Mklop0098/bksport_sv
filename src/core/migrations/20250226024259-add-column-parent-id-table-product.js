'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'parent_id', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column parent_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'parent_id', function (err) {
    if (err) {
      console.error(`Error removing column parent_id:`, err);
      return callback(err);
    }
    callback();
  });
};