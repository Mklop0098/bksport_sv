'use strict';

let tableName = 'seller';
let columnName = 'code';

exports.up = function (db, callback) {
  db.addColumn(tableName, columnName, { type: 'string', length: 8, notNull: true }, function (err) {
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