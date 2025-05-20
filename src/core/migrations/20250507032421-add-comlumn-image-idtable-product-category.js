'use strict';

let tableName = 'product_category';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'image_id', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column image_id:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'image_id', function (err) {
    if (err) {
      console.error(`Error removing column image_id:`, err);
      return callback(err);
    }
    callback();
  });

}