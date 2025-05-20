exports.up = function (db, callback) {
  db.createTable('seller', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    name: { type: 'string', length: 255, notNull: true, },
    email: { type: 'string', length: 255, notNull: true },
    phone: { type: 'string', length: 10 },
    url: { type: 'string', length: 255 },
    active: { type: 'boolean', notNull: true, defaultValue: true, commnet: 'Trạng thái tài khoản: 0 vô hiệu hoá, 1: đang hoạt động' },
    created_id: { type: 'int' , defaultValue: 0},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create seller table:', err);
      return callback(err);
    }
    //console.log('seller table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('seller', function (err) {
    if (err) {
      console.error('err drop seller table:', err);
      return callback(err);
    }
    //console.log('seller table dropped successfully');
    callback();
  });
};