'use strict';
let tableName = 'purchase_status_payment_history';

exports.up = function (db, callback) {
  db.createTable(tableName, {
    id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
    order_id: { type: 'int', notNull: true },
    user_id: { type: 'int', notNull: true },
    status: { type: 'string', length: 50, notNull: true, defaultValue: 'chua_thanh_toan', comment: 'chua_thanh_toan: chưa thanh toán, da_thanh_toan: đã thanh toán, thanh_toan_mot_phan: thanh toán một phần' },
    amount_paid: { type: 'decimal', notNull: true, defaultValue: 0 },
    payment_method: { type: 'string', length: 50, allowNull: true, defaultValue: null, comment: 'tien_mat: tiền mặt, chuyen_khoan: chuyển khoản, the: thẻ' },
    payment_date: { type: 'timestamp', allowNull: true, defaultValue: 'CURRENT_TIMESTAMP' },
    seller_id: { type: 'int', allowNull: true, defaultValue: 0 },
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
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

