exports.up = function (db, callback) {
  db.createTable('slug', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    type: { type: 'text', notNull: true },
    slug: { type: 'text', notNull: true },
    // item_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create slug:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('slug', function (err) {
    if (err) {
      console.error('err drop slug:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};