'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'type', { type: 'string', defaultValue: "normal" }, function (err) {
    if (err) {
      console.error(`Error adding column type:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'type', function (err) {
    if (err) {
      console.error(`Error removing column type:`, err);
      return callback(err);
    }
    callback();
  });  
};