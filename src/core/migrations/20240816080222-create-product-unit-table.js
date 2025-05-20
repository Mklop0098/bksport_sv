'use strict';
let tableName = 'product_unit';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    name: { type: 'string', length: 255, notNull: true },
    publish: { type: 'boolean', notNull: true, defaultValue: true },
    created_id: { type: 'int', notNull: true },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create ' +tableName+ ' table:', err);
      return callback(err);
    }
    //console.log('' +tableName+ ' table created successfully');
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable(tableName, function (err) {
    if (err) {
      console.error('err drop ' +tableName+ ' table:', err);
      return callback(err);
    }
    //console.log('' +tableName+ ' table dropped successfully');
    callback();
  });
};
