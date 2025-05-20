const { str } = require("envalid");

exports.up = function (db, callback) {
  db.createTable('product_image', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    product_id: { type: 'int', notNull: true },
    image: { type: 'string', length: 512, notNull: true },
    publish: { type: 'boolean', notNull: true, defaultValue: true, commnet: 'Trạng thái tài khoản: 0 vô hiệu hoá, 1: đang hoạt động' },
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