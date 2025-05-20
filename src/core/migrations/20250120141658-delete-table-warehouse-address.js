exports.down = function (db, callback) {
  db.createTable('warehouse_address', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    seller_id: { type: 'int', notNull: true },
    warehouse_type: { type: 'int', defaultValue: 0 },
    city_id: { type: 'int', notNull: true, defaultValue: 0 },
    district_id: { type: 'int', notNull: true, defaultValue: 0 },
    ward_id: { type: 'int', notNull: true, defaultValue: 0 },
    address: { type: 'text'},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create warehouse_address table:', err);
      return callback(err);
    }
    //console.log('warehouse_address table created successfully');
    callback();
  });
};

exports.up = function (db, callback) {
  db.dropTable('warehouse_address', function (err) {
    if (err) {
      console.error('err drop warehouse_address table:', err);
      return callback(err);
    }
    //console.log('warehouse_address table dropped successfully');
    callback();
  });
};