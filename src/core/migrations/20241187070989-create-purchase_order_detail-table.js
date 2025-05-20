'use strict';
let tableName = 'purchase_order_detail';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    order_id: { type: 'int', notNull: true },
    product_id: { type: 'int', notNull: true },
    quantity: { type: 'int', notNull: true },
    price: { type: 'decimal', notNull: true },
    discount_value: { type: 'decimal', precision: 10, scale: 2, defaultValue: 0 },
    discount_type: { type: 'int', defaultValue: 0, comment: '0: không có chiết khấu, 1: chiết khấu theo %, 2: chiết khấu theo số tiền' },
  }, function (err) {
    if (err) {
      console.error('err create ' + tableName + ' table:', err);
      return callback(err);
    }
    //console.log('' + tableName + ' table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable(tableName, function (err) {
    if (err) {
      console.error('err drop ' + tableName + ' table:', err);
      return callback(err);
    }
    //console.log('' + tableName + ' table dropped successfully');
    callback();
  });
};

