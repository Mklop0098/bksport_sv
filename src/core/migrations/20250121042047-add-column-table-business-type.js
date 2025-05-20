'use strict';

let tableName = 'business_type';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'is_personal', { type: 'boolean', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column is_personal:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'is_personal', function (err) {
    if (err) {
      console.error(`Error removing column is_personal:`, err);
      return callback(err);
    }
    callback();
  });
};