exports.up = function (db, callback) {
  db.createTable('warehouse', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    product_id: { type: 'int', notNull: true },
    supplier_id: { type: 'int', notNull: true },
    branch_id: { type: 'int', notNull: true },
    quantity: { type: 'int', notNull: true, defaultValue: 0 },
    created_id: { type: 'int', defaultValue: 0 },
    seller_id: { type: 'int', allowNull: true, defaultValue: 0 },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create warehouse table:', err);
      return callback(err);
    }
    //console.log('warehouse table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('warehouse', function (err) {
    if (err) {
      console.error('err drop warehouse table:', err);
      return callback(err);
    }
    //console.log('warehouse table dropped successfully');
    callback();
  });
};