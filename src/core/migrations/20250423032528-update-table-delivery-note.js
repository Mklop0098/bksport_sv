'use strict';

let tableName = 'delivery_note';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'delivery_type', { type: 'string' }, function (err) {
    if (err) {
      console.error(`Error adding column delivery_type:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'delivery_type', function (err) {
    if (err) {
      console.error(`Error removing column delivery_type:`, err);
      return callback(err);
    }
    callback();
  });

}