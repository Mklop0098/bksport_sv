exports.up = function (db, callback) {
  db.createTable('warehouse_export_type', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    code: { type: 'int', notNull: true },
    name: { type: 'text', notNull: true },
    status: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create warehouse_export_type:', err);
      return callback(err);
    }
    //console.log('bank table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('warehouse_export_type', function (err) {
    if (err) {
      console.error('err drop warehouse_export_type:', err);
      return callback(err);
    }
    //console.log('bank table dropped successfully');
    callback();
  });
};