'use strict';

exports.up = function(db, callback) {
  db.runSql('CREATE INDEX idx_orders_created_at  ON orders (created_at);', function(err) {
    if (err) return callback(err);
    db.runSql('CREATE INDEX idx_order_status_history_order_status ON order_status_history (order_id, status);', function(err) {
      if (err) return callback(err);
      db.runSql('CREATE INDEX idx_order_detail_order_id ON order_detail (order_id);', function(err) {
        if (err) return callback(err);
        db.runSql('CREATE INDEX idx_order_detail_product_id ON order_detail (product_id);', callback);
      });
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('DROP INDEX idx_orders_created_at ON orders;', function(err) {
    if (err) return callback(err);
    db.runSql('DROP INDEX idx_order_status_history_order_status ON order_status_history;', function(err) {
      if (err) return callback(err);
      db.runSql('DROP INDEX idx_order_detail_order_id ON order_detail;', function(err) {
        if (err) return callback(err);
        db.runSql('DROP INDEX idx_order_detail_product_id ON order_detail;', callback);
      });
    });
  });
};