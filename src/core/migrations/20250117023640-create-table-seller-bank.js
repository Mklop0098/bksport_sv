exports.up = function (db, callback) {
  db.createTable('seller_bank', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    seller_id: { type: 'int', notNull: true },
    city_id: { type: 'int', notNull: true, defaultValue: 0 },
    bank_id: { type: 'int', notNull: true, defaultValue: 0 },
    account_name: { type: 'string', notNull: true },
    account_number: { type: 'string', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create seller_bank table:', err);
      return callback(err);
    }
    //console.log('seller_bank table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('seller_bank', function (err) {
    if (err) {
      console.error('err drop seller_bank table:', err);
      return callback(err);
    }
    //console.log('seller_bank table dropped successfully');
    callback();
  });
};