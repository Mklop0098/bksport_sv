'use strict';

let tableName = 'product';
let columnName = 'price_sale';

exports.up = function (db, callback) {
  db.addColumn(tableName, columnName, { type: 'DECIMAL(10,0)', defaultValue: 0 }, function (err) {
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