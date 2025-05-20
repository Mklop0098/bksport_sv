exports.up = function (db, callback) {
  db.createTable('order_delivery_method', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    order_id: { type: 'int', notNull: true },
    method: { type: 'varchar', notNull: true },
    shipper_id: { type: 'int' },
    ship_key: { type: 'varchar' },
    ship_fee: { type: 'int' },
    ship_fee_payer: { type: 'varchar'},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create order_delivery_method:', err);
      return callback(err);
    }
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('order_delivery_method', function (err) {
    if (err) {
      console.error('err drop order_delivery_method:', err);
      return callback(err);
    }
    callback();
  });
};