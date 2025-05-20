'use strict';

let tableName = 'module';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'url', { type: 'text'}, function (err) {
    if (err) {
      console.error(`Error adding column url:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'url', function (err) {
    if (err) {
      console.error(`Error removing column url:`, err);
      return callback(err);
    }
    callback();
  });
};