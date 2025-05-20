'use strict';

let tableName = 'product';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'brand_origin', { type: 'string' }, function (err) {
    if (err) {
      console.error(`Error adding column brand_origin:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'made_in', { type: 'string' }, function (err) {
    if (err) {
      console.error(`Error adding column made_in:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'brand_origin', function (err) {
    if (err) {
      console.error(`Error removing column brand_origin:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'made_in', function (err) {
    if (err) {
      console.error(`Error removing column made_in:`, err);
      return callback(err);
    }
    callback();
  });
};