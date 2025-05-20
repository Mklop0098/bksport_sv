'use strict';

let tableName = 'product_unit';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'local_unit', { type: 'boolean', defaultValue: false }, function (err) {
    if (err) {
      console.error(`Error adding column combo_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'local_unit', function (err) {
    if (err) {
      console.error(`Error removing column local_unit:`, err);
      return callback(err);
    }
    callback();
  });

}