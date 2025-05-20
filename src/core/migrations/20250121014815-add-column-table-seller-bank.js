'use strict';

let tableName = 'seller_bank';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'is_default', { type: 'boolean', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column is_default:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'is_default', function (err) {
    if (err) {
      console.error(`Error removing column is_default:`, err);
      return callback(err);
    }
    callback();
  });
};