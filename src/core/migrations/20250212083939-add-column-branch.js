'use strict';

let tableName = 'branch';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'online_selling', { type: 'boolean', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column online_selling:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'online_selling', function (err) {
    if (err) {
      console.error(`Error removing column online_selling:`, err);
      return callback(err);
    }
    callback();
  });
};