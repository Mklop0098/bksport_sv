'use strict';

let tableName = 'product_category';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'type', { type: 'int', defaultValue: 1 }, function (err) {
    if (err) {
      console.error(`Error adding column type:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'type', function (err) {
    if (err) {
      console.error(`Error removing column type:`, err);
      return callback(err);
    }
    callback();
  });
};