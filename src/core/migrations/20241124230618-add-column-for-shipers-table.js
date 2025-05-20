'use strict';

let tableName = 'shipers';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'code', { type: 'string', defaultValue: '', after: 'name' }, function (err) {
    if (err) {
      console.error(`Error adding column ${columnName}:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'code', function (err) {
    if (err) {
      console.error(`Error removing column ${columnName}:`, err);
      return callback(err);
    }
    callback();
  });
};