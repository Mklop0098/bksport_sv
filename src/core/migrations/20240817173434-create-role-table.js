exports.up = function (db, callback) {
  db.createTable('role', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 8, notNull: true },
    name: { type: 'string', length: 255, notNull: true },
    publish: { type: 'boolean', notNull: true, defaultValue: true },
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