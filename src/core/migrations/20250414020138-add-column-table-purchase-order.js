'use strict';

let tableName = 'purchase_order';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'from_branch_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column from_branch_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.addColumn(tableName, 'from_branch_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column from_branch_id:`, err);
      return callback(err);
    }
    callback();
  });  
};