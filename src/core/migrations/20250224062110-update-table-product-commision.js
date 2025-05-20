'use strict';

exports.down = function (db, callback) {
  db.changeColumn("product_commission", "commission", {
    type: "int",
  }, callback);
};

exports.up = function (db, callback) {
  db.changeColumn("product_commission", "commission", {
    type: "DECIMAL(10, 2)"
  }, callback);
};
