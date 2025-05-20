exports.up = function (db, callback) {
  db.createTable('user_role', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    user_id: { type: 'int', notNull: true },
    role_id: { type: 'int', notNull: true },
    created_id: { type: 'int', notNull: true },
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