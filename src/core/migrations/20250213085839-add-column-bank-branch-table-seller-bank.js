'use strict';

let tableName = 'seller_bank';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'bank_branch', { type: 'text'}, function (err) {
    if (err) {
      console.error(`Error adding column bank_branch:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'bank_branch', function (err) {
    if (err) {
      console.error(`Error removing column bank_branch:`, err);
      return callback(err);
    }
    callback();
  });
};