exports.up = function (db, callback) {
  db.createTable('customer_group', {
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
      console.error('err create customer_group table:', err);
      return callback(err);
    }
    //console.log('customer_group table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('customer_group', function (err) {
    if (err) {
      console.error('err drop customer_group table:', err);
      return callback(err);
    }
    //console.log('customer_group table dropped successfully');
    callback();
  });
};