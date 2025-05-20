exports.up = function (db, callback) {
  db.createTable('shipers', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    name: { type: 'string', length: 255, notNull: true, },
    email: { type: 'string', length: 255, notNull: true },
    phone: { type: 'string', length: 10 },
    address: { type: 'text' },
    note: { type: 'text' },
    active: { type: 'boolean', notNull: true, defaultValue: true, commnet: 'Trạng thái hoạt động: 0- ngừng hoạt động, 1- đang hoạt động' },
    type: { type: 'string', length: 100, commnet: 'Loại: le: lẻ, cua_hang: cửa hàng' },
    seller_id: { type: 'int' , defaultValue: 0},
    branch_id: { type: 'int' , defaultValue: 0},
    created_id: { type: 'int' , defaultValue: 0},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create shipers table:', err);
      return callback(err);
    }
    //console.log('Shipers table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('shipers', function (err) {
    if (err) {
      console.error('err drop shipers table:', err);
      return callback(err);
    }
    //console.log('shipers table dropped successfully');
    callback();
  });
};