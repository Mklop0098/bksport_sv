'use strict';

exports.up = function(db, callback) {
  db.runSql('CREATE INDEX idx_pod_order_id ON purchase_order_detail (order_id);', function(err) {
    if (err) return callback(err);
    db.runSql('CREATE INDEX idx_pod_product_id ON purchase_order_detail (product_id);', function(err) {
      if (err) return callback(err);
      db.runSql('CREATE INDEX idx_posh_order_id ON purchase_order_status_history (order_id);', function(err) {
        if (err) return callback(err);
        db.runSql('CREATE INDEX idx_posh_status ON purchase_order_status_history (status);', function(err) {
          if (err) return callback(err);
          db.runSql('CREATE INDEX idx_psph_order_id ON purchase_status_payment_history (order_id);', function(err) {
            if (err) return callback(err);
            db.runSql('CREATE INDEX idx_purchase_order_supplier_id ON purchase_order(supplier_id);', function(err) {
              if (err) return callback(err);
              db.runSql('CREATE INDEX idx_purchase_order_branch_id ON purchase_order(branch_id);', callback);
            });
          });
        });
      });
    });
  });
};

exports.down = function(db, callback) {
  db.runSql('DROP INDEX idx_pod_order_id ON purchase_order_detail;', function(err) {
    if (err) return callback(err);
    db.runSql('DROP INDEX idx_pod_product_id ON purchase_order_detail;', function(err) {
      if (err) return callback(err);
      db.runSql('DROP INDEX idx_posh_order_id ON purchase_order_status_history;', function(err) {
        if (err) return callback(err);
        db.runSql('DROP INDEX idx_posh_status ON purchase_order_status_history;', function(err) {
          if (err) return callback(err);
          db.runSql('DROP INDEX idx_psph_order_id ON purchase_status_payment_history;', function(err) {
            if (err) return callback(err);
            db.runSql('DROP INDEX idx_purchase_order_supplier_id ON purchase_order;', function(err) {
              if (err) return callback(err);
              db.runSql('DROP INDEX idx_purchase_order_branch_id ON purchase_order;', callback);
            });
          });
        });
      });
    });
  });
};
