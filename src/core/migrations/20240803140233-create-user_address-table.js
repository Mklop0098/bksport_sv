const { str } = require("envalid");

exports.up = function (db, callback) {
  db.createTable('user_address', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    customer_id: { type: 'int', notNull: true },
    name: { type: 'string', length: 255 },
    phone: { type: 'string', length: 10 },
    city_id: { type: 'int', notNull: true, defaultValue: 0 },
    district_id: { type: 'int', notNull: true, defaultValue: 0 },
    ward_id: { type: 'int', notNull: true, defaultValue: 0 },
    address: { type: 'text' },
    is_default: { type: 'boolean', notNull: true, defaultValue: false },
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