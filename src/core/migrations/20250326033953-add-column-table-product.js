'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'publish_yomart', { type: 'boolean', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column publish_yomart:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'publish_yomart', function (err) {
    if (err) {
      console.error(`Error removing column publish_yomart:`, err);
      return callback(err);
    }
    callback();
  });
};