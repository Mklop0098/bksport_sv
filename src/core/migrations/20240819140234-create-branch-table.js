exports.up = function (db, callback) {
  db.createTable('branch', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 8, notNull: true },
    name: { type: 'string', length: 255, notNull: true },
    publish: { type: 'boolean', notNull: true, defaultValue: true },
    is_default: { type: 'boolean', defaultValue: false },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create branch table:', err);
      return callback(err);
    }
    //console.log('branch table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('branch', function (err) {
    if (err) {
      console.error('err drop branch table:', err);
      return callback(err);
    }
    //console.log('branch table dropped successfully');
    callback();
  });
};