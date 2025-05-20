exports.up = function (db, callback) {
  db.createTable('employee_branch', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    user_id: { type: 'int', notNull: true },
    seller_id: { type: 'int', notNull: true },
    branch_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create employee_branch:', err);
      return callback(err);
    }
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('employee_branch', function (err) {
    if (err) {
      console.error('err drop employee_branch:', err);
      return callback(err);
    }
    callback();
  });
};