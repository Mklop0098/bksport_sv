exports.up = function (db, callback) {
  db.createTable('business_type', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    name: { type: 'string', length: 255, notNull: true, },
    publish: { type: 'boolean', notNull: true, defaultValue: true, commnet: 'Trạng thái hoạt động: 0- ngừng hoạt động, 1- đang hoạt động' },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create business_type table:', err);
      return callback(err);
    }
    //console.log('business_type table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('business_type', function (err) {
    if (err) {
      console.error('err drop business_type table:', err);
      return callback(err);
    }
    //console.log('business_type table dropped successfully');
    callback();
  });
};