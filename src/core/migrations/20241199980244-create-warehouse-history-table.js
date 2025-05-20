exports.up = function (db, callback) {
  db.createTable('warehouse_history', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    bill_code: { type: 'string', length: 20, notNull: true },
    branch_id: { type: 'int', notNull: true, defaultValue: 0 },
    product_id: { type: 'int', notNull: true },
    quantity_before: { type: 'int', notNull: true, defaultValue: 0 },
    quantity_after: { type: 'int', notNull: true, defaultValue: 0 },
    quantity: { type: 'int', notNull: true, defaultValue: 0 },
    type: { type: 'string', length: 255, allowNull: true, defaultValue: null, comment: 'nhap_hang: nhập hàng, xuat_hang: xuất hàng' },
    note: { type: 'string', length: 255, allowNull: true, defaultValue: null, comment: 'ban_hang, chuyen_kho, tra_hang' },
    created_id: { type: 'int', defaultValue: 0 },
    seller_id: { type: 'int', allowNull: true, defaultValue: 0 },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create warehouse_history table:', err);
      return callback(err);
    }
    //console.log('warehouse_history table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('warehouse_history', function (err) {
    if (err) {
      console.error('err drop warehouse_history table:', err);
      return callback(err);
    }
    //console.log('warehouse_history table dropped successfully');
    callback();
  });
};