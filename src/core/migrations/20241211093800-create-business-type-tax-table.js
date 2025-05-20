exports.up = function (db, callback) {
  db.createTable('business_type_tax', {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    type: { type: 'string', length: 100, notNull: true, commnet: 'Loại: seller- dành cho nhà bán, affiliate- dành cho affiliate'},
    business_type_id: { type: 'int' , defaultValue: 0},
    tax_vat: { type: 'int' , defaultValue: 0},
    tax_tncn: { type: 'int' , defaultValue: 0},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create business_type_tax table:', err);
      return callback(err);
    }
    //console.log('business_type_tax table created successfully');
    callback();
  });
};

exports.down = function (db, callback) {
  db.dropTable('business_type_tax', function (err) {
    if (err) {
      console.error('err drop business_type_tax table:', err);
      return callback(err);
    }
    //console.log('business_type_tax table dropped successfully');
    callback();
  });
};