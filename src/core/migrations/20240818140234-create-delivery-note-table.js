exports.up = function (db, callback) {
  db.createTable('delivery_note', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 8, notNull: true },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create delivery_note table:', err);
      return callback(err);
    }
    //console.log('delivery_note table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('delivery_note', function (err) {
    if (err) {
      console.error('err drop delivery_note table:', err);
      return callback(err);
    }
    //console.log('delivery_note table dropped successfully');
    callback();
  });
};