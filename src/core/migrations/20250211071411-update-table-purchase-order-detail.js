'use strict';

let tableName = 'purchase_order_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'prime_cost', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column prime_cost:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'prime_cost', function (err) {
    if (err) {
      console.error(`Error removing column prime_cost:`, err);
      return callback(err);
    }
    callback();
  });
};