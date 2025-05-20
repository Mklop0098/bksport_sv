exports.up = function (db, callback) {
  db.createTable('seller_address', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    seller_id: { type: 'int', notNull: true },
    city_id: { type: 'int', notNull: true, defaultValue: 0 },
    district_id: { type: 'int', notNull: true, defaultValue: 0 },
    ward_id: { type: 'int', notNull: true, defaultValue: 0 },
    address: { type: 'text'},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create seller_address table:', err);
      return callback(err);
    }
    //console.log('seller_address table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('seller_address', function (err) {
    if (err) {
      console.error('err drop seller_address table:', err);
      return callback(err);
    }
    //console.log('seller_address table dropped successfully');
    callback();
  });
};