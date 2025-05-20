'use strict';
let tableName = 'order_detail';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    order_id: { type: 'int', notNull: true },
    product_id: { type: 'int', notNull: true },
    quantity: { type: 'int', notNull: true },
    price: { type: 'decimal', notNull: true },
    price_wholesale: { type: 'decimal' },
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

