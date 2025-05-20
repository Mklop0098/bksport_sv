'use strict';

let tableName = 'product';
let columnName = 'category_id';

exports.up = function (db, callback) {
  db.addColumn(tableName, columnName, { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column ${columnName}:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, columnName, function (err) {
    if (err) {
      console.error(`Error removing column ${columnName}:`, err);
      return callback(err);
    }
    callback();
  });
};