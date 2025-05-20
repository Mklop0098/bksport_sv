'use strict';
let tableName = 'order_booking_detail';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    order_id: { type: 'int', notNull: true },
    date: { type: 'string', notNull: true },
    time: { type: 'string', notNull: true },
    meridiem: { type: 'string', defaultValue: 'AM' }
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

