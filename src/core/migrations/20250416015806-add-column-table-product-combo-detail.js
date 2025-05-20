'use strict';

let tableName = 'product_combo_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'price_combo', { type: 'int', defaultValue: 0 }, function (err) {
    if (err) {
      console.error(`Error adding column price_combo:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'discount_type', { type: 'int', defaultValue: 1 }, function (err) {
    if (err) {
      console.error(`Error adding column discount_type:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'discount_value', { type: 'int', defaultValue: 0 }, function (err) {
    if (err) {
      console.error(`Error adding column discount_value:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
    db.removeColumn(tableName, 'price_combo', function (err) {
    if (err) {
      console.error(`Error removing column price_combo:`, err);
      return callback(err);
    }
    callback();
  });  
  db.removeColumn(tableName, 'discount_type', function (err) {
    if (err) {
      console.error(`Error removing column discount_type:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'discount_value', function (err) {
    if (err) {
      console.error(`Error removing column discount_value:`, err);
      return callback(err);
    }
    callback();
  });
}