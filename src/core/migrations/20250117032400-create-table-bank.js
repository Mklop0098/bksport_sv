exports.up = function (db, callback) {
  db.createTable('bank', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'string', notNull: true },
    bin: { type: 'string', notNull: true },
    shortName: { type: 'string' },
    logo: { type: 'string', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create bank table:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('bank', function (err) {
    if (err) {
      console.error('err drop bank table:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};