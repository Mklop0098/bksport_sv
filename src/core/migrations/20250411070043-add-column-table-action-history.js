'use strict';

let tableName = 'action_history';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'reason', { type: 'text' }, function (err) {
    if (err) {
      console.error(`Error adding column reason:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'reason', function (err) {
    if (err) {
      console.error(`Error removing column reason:`, err);
      return callback(err);
    }
    callback();
  });
};