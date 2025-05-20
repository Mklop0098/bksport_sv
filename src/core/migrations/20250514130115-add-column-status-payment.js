'use strict';

let tableName = 'orders_booking';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'status_payment', { type: 'int', defaultValue: 0 }, function (err) {
    if (err) {
      console.error(`Error adding column status_payment:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'status_payment', function (err) {
    if (err) {
      console.error(`Error removing column status_payment:`, err);
      return callback(err);
    }
    callback();
  });

}