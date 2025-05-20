'use strict';
let tableName = 'product';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    code: { type: 'string', length: 16, notNull: true },
    name: { type: 'string', length: 255 },
    price: { type: 'decimal', precision: 10, commnet: "giá bán lẻ" },
    price_wholesale: { type: 'decimal', precision: 10, comment: "giá bán buôn" },
    price_import: { type: 'decimal', precision: 10, comment: 'giá nhập vào' },
    brand_id: { type: 'int' },
    product_type_id: { type: 'int' },
    description: { type: 'text' },
    is_sell: { type: 'boolean', notNull: true, defaultValue: true },
    unit_id: { type: 'string', length: 50, comment: 'đơn vị tính' },
    weight: { type: 'decimal', precision: 10, commnet: 'khối lượng' },
    publish: { type: 'boolean', notNull: true, defaultValue: true },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
  }, function (err) {
    if (err) {
      console.error('err create ' + tableName + ' table:', err);
      return callback(err);
    }
    //console.log('' + tableName + ' table created successfully');
    callback();
  })
};
exports.down = function (db, callback) {
  db.dropTable(tableName, function (err) {
    if (err) {
      console.error('err drop ' + tableName + ' table:', err);
      return callback(err);
    }
    //console.log('' + tableName + ' table dropped successfully');
    callback();
  });
};
