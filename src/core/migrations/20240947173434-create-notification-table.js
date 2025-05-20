exports.up = function (db, callback) {
  db.createTable('notification', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    receiver_id: { type: 'int', notNull: true, comment: 'ID người nhận thông báo' },
    message: { type: 'text', notNull: true, comment: 'Nội dung thông báo' },
    status: { type: 'int', defaultValue: 0, comment: 'Trạng thái thông báo' },
    notification_type_id: { type: 'int', notNull: true, comment: 'Loại thông báo' },
    user_id: { type: 'int', notNull: true, comment: 'ID người gởi thông báo' },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create role table:', err);
      return callback(err);
    }
    //console.log('role table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('role', function (err) {
    if (err) {
      console.error('err drop role table:', err);
      return callback(err);
    }
    //console.log('role table dropped successfully');
    callback();
  });
};