'use strict';

let tableName = 'delivery_note';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'order_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column order_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'order_id', function (err) {
    if (err) {
      console.error(`Error removing column order_id:`, err);
      return callback(err);
    }
    callback();
  });
};