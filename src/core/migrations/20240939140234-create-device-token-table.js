exports.up = function (db, callback) {
  db.createTable('device_token', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    token: { type: 'string', length: 512, notNull: true },
    user_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('Error creating token table:', err);
      return callback(err);
    }
    //console.log('token table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('token', function (err) {
    if (err) {
      console.error(err);
      return callback(err);
    }
    //console.log('token dropped successfully');
    callback();
  });
};
