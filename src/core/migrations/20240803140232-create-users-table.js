exports.up = function (db, callback) {
  db.createTable('users', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    password: { type: 'string', length: 255, notNull: true },
    name: { type: 'string', length: 255, notNull: true, },
    email: { type: 'string', length: 255, notNull: true },
    phone: { type: 'string', length: 10 },
    avatar: { type: 'string', length: 255 },
    token: { type: 'string', length: 255 },
    active: { type: 'boolean', notNull: true, defaultValue: true, commnet: 'Trạng thái tài khoản: 0 vô hiệu hoá, 1: đang hoạt động' },
    created_id: { type: 'int' },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create users table:', err);
      return callback(err);
    }
    //console.log('users table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('users', function (err) {
    if (err) {
      console.error('err drop users table:', err);
      return callback(err);
    }
    //console.log('users table dropped successfully');
    callback();
  });
};