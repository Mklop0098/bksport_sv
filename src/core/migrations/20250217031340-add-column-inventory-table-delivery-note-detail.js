'use strict';

let tableName = 'delivery_note_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'inventory', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column inventory:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'inventory', function (err) {
    if (err) {
      console.error(`Error removing column inventory:`, err);
      return callback(err);
    }
    callback();
  });
};