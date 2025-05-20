exports.up = function (db, callback) {
  db.createTable('product_attribute_detail', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    attribute_id: { type: 'int', notNull: true },
    value: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create bank product_attribute_detail:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('product_attribute_detail', function (err) {
    if (err) {
      console.error('err drop bank product_attribute_detail:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};