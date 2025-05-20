exports.up = function (db, callback) {
  db.createTable('product_combo_detail', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    combo_id: { type: 'int', notNull: true },
    product_id: { type: 'int', notNull: true },
    quantity: { type: 'int', notNull: true },
    price: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create product_combo_detail:', err);
      return callback(err);
    }
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('product_combo_detail', function (err) {
    if (err) {
      console.error('err drop product_combo_detail:', err);
      return callback(err);
    }
    callback();
  });
};