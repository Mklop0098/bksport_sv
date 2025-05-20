exports.up = function (db, callback) {
  db.createTable('seller_category', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    seller_id: { type: 'int', notNull: true },
    category_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create seller_category table:', err);
      return callback(err);
    }
    //console.log('seller_category table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('seller_category', function (err) {
    if (err) {
      console.error('err drop seller_category table:', err);
      return callback(err);
    }
    //console.log('seller_category table dropped successfully');
    callback();
  });
};