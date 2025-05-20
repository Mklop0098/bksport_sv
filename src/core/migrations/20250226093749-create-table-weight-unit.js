exports.up = function (db, callback) {
  db.createTable('weight_unit', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create weight_unit:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('weight_unit', function (err) {
    if (err) {
      console.error('err drop weight_unit:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};