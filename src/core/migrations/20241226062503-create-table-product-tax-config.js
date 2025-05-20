exports.up = function (db, callback) {
  db.createTable('product_tax_config', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    product_id: { type: 'int', notNull: true },
    tax_vat_in: { type: 'int' },
    tax_vat_out: { type: 'int' },
    tax_product_apply: {type: 'boolean', defaultValue: 0},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create product_tax_config table:', err);
      return callback(err);
    }
    //console.log('product_tax_config table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('product_tax_config', function (err) {
    if (err) {
      console.error('err drop product_tax_config table:', err);
      return callback(err);
    }
    //console.log('product_tax_config table dropped successfully');
    callback();
  });
};