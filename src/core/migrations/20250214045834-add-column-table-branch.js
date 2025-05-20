'use strict';

let tableName = 'branch';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'latitude', { type: 'text'}, function (err) {
    if (err) {
      console.error(`Error adding column latitude:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'longitude', { type: 'text'}, function (err) {
    if (err) {
      console.error(`Error adding column longitude:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'latitude', function (err) {
    if (err) {
      console.error(`Error removing column latitude:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'longitude', function (err) {
    if (err) {
      console.error(`Error removing column longitude:`, err);
      return callback(err);
    }
    callback();
  });
};