'use strict';

let tableName = 'orders';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'branch_id', { type: 'int'}, function (err) {
    if (err) {
      console.error(`Error adding column branch_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'branch_id', function (err) {
    if (err) {
      console.error(`Error removing column branch_id:`, err);
      return callback(err);
    }
    callback();
  });
};