'use strict';

let tableName = 'order_detail';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'discount_value', {
    type: 'decimal',
    precision: 10,
    scale: 2,
    notNull: false,
    defaultValue: 0
  }, function (err) {
    if (err) {
      console.error('err adding discount_value to ' + tableName + ' table:', err);
      return callback(err);
    }

    db.addColumn(tableName, 'discount_type', {
      type: 'int',
      defaultValue: 0,
      comment: '0: không có chiết khấu, 1: chiết khấu theo %, 2: chiết khấu theo số tiền'
    }, function (err) {
      if (err) {
        console.error('err adding discount_type to ' + tableName + ' table:', err);
        return callback(err);
      }
      //console.log('discount_value and discount_type added successfully to ' + tableName);
      callback();
    });
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'discount_value', function (err) {
    if (err) {
      console.error('err removing discount_value from ' + tableName + ' table:', err);
      return callback(err);
    }

    db.removeColumn(tableName, 'discount_type', function (err) {
      if (err) {
        console.error('err removing discount_type from ' + tableName + ' table:', err);
        return callback(err);
      }
      //console.log('discount_value and discount_type removed successfully from ' + tableName);
      callback();
    });
  });
};
