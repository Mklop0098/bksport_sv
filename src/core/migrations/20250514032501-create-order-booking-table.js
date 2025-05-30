'use strict';

let tableName = 'orders_booking';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 10, notNull: true },
    name: { type: 'string', length: 255, notNull: true },
    phone: { type: 'string', length: 255, notNull: true },
    customer_id: { type: 'int', notNull: true },
    city_id: { type: 'int' },
    district_id: { type: 'int' },
    ward_id: { type: 'int' },
    address: { type: 'string', length: 512 },
    field_id: { type: 'int' },
    pay_method: { type: 'int' },
    status: { type: 'int', notNull: true, defaultValue: 1 },
    des: { type: 'text' },
    price: { type: 'int', notNull: true, defaultValue: 0 },
    voucher: { type: 'text' },
    drink_ready: {type: 'boolean', defaultValue: false},
    created_id: { type: 'int', notNull: true },
    seller_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
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