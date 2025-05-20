'use strict';

let tableName = 'purchase_order';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 20, notNull: true },
    supplier_id: { type: 'int', notNull: true },
    branch_id: { type: 'int' },
    status: { type: 'string', length: 50, notNull: true },
    note: { type: 'text' },
    created_id: { type: 'int', notNull: true },
    status_payment: { type: 'string', length: 50, notNull: true },
    delivery_date: { type: 'timestamp' , allowNull: true },
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