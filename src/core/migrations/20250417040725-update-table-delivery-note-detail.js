'use strict';

let tableName = 'delivery_note_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'in_combo', { type: 'boolean', defaultValue: 0 }, function (err) {
    if (err) {
      console.error(`Error adding column in_combo:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'in_combo', function (err) {
    if (err) {
      console.error(`Error removing column in_combo:`, err);
      return callback(err);
    }
    callback();
  });

}