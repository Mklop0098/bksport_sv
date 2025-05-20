'use strict';

exports.up = function (db, callback) {
  db.removeIndex("supplier", "email", callback);
};

exports.down = function (db, callback) {
  db.addIndex(
    "supplier",
    "email",
    ["email"],
    true, // true nghĩa là UNIQUE
    callback
  );
};

