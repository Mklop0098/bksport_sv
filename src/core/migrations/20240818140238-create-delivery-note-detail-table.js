exports.up = function (db, callback) {
  db.createTable('delivery_note_detail', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    delivery_note_id: { type: 'int', notNull: true },
    product_id: { type: 'int', notNull: true },
    qty: { type: 'int', notNull: true },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create delivery_note_detail table:', err);
      return callback(err);
    }
    //console.log('delivery_note_detail table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('delivery_note_detail', function (err) {
    if (err) {
      console.error('err drop delivery_note_detail table:', err);
      return callback(err);
    }
    //console.log('delivery_note_detail table dropped successfully');
    callback();
  });
};