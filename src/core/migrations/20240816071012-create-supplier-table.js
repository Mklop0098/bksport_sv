'use strict';
let tableName = 'supplier';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    group_id: { type: 'int', comment: 'ID nhóm khách hàng' },
    name: { type: 'string', length: 255, notNull: true },
    email: { type: 'string', length: 255, notNull: true, unique: true },
    phone: { type: 'string', length: 10 },
    address: { type: 'text' },
    city_id: { type: 'int', notNull: true },
    district_id: { type: 'int', notNull: true },
    ward_id: { type: 'int', notNull: true },
    status: { type: 'int', defaultValue: 1 },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create ' + tableName + ' table:', err);
      return callback(err);
    }
    //console.log('' + tableName + ' table created successfully');
    callback();
  });
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