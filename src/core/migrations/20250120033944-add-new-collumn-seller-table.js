'use strict';

let tableName = 'seller';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'personal_PIT', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column personal_PIT:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'personal_PIT', function (err) {
    if (err) {
      console.error(`Error removing column personal_PIT:`, err);
      return callback(err);
    }
    callback();
  });
};