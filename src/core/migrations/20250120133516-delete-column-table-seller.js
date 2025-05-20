'use strict';

let tableName = 'seller';

exports.down = function (db, callback) {
  db.addColumn(tableName, 'shop_owner', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column shop_owner:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.up = function (db, callback) {
  db.removeColumn(tableName, 'shop_owner', function (err) {
    if (err) {
      console.error(`Error removing column shop_owner:`, err);
      return callback(err);
    }
    callback();
  });
};