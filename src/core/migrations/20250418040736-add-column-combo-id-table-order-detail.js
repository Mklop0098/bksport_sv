'use strict';

let tableName = 'order_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'combo_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column combo_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'combo_id', function (err) {
    if (err) {
      console.error(`Error removing column combo_id:`, err);
      return callback(err);
    }
    callback();
  });

}