'use strict';

let tableName = 'orders';
let columnName = 'status_payment';

exports.up = function (db, callback) {
  db.addColumn(tableName, columnName, { type: 'int', defaultValue: 0 }, function (err) {
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