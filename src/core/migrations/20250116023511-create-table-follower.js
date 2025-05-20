exports.up = function (db, callback) {
  db.createTable('follower', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    user_id: { type: 'int', notNull: true },
    seller_id: { type: 'int', notNull: true },
    follow_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create follower table:', err);
      return callback(err);
    }
    //console.log('follower table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('follower', function (err) {
    if (err) {
      console.error('err drop follower table:', err);
      return callback(err);
    }
    //console.log('follower table dropped successfully');
    callback();
  });
};