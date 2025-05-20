exports.up = function (db, callback) {
  db.createTable('product_attributes', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'string', notNull: true },
    product_parent_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create bank product_attributes:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('product_attributes', function (err) {
    if (err) {
      console.error('err drop bank product_attributes:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};