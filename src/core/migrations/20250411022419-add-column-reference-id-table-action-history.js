'use strict';

let tableName = 'action_history';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'reference_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column reference_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'reference_id', function (err) {
    if (err) {
      console.error(`Error removing column reference_id:`, err);
      return callback(err);
    }
    callback();
  });
};