'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'max_inventory', { type: 'int'}, function (err) {
    if (err) {
      console.error(`Error adding column max_inventory:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'min_inventory', { type: 'int',  defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column min_inventory:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'max_inventory', function (err) {
    if (err) {
      console.error(`Error removing column max_inventory:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'min_inventory', function (err) {
    if (err) {
      console.error(`Error removing column min_inventory:`, err);
      return callback(err);
    }
    callback();
  });
};