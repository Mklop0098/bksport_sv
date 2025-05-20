'use strict';

let tableName = 'order_detail';
let columnName = 'price_type';

exports.up = function (db, callback) {
  db.addColumn(tableName, columnName, { type: 'int', defaultValue: 1 }, function (err) {
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