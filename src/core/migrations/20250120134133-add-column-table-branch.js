'use strict';

let tableName = 'branch';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'city_id', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column city_id:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'district_id', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column district_id:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'ward_id', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column ward_id:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'address', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column address:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'warehouse_type', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column warehouse_type:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'city_id', function (err) {
    if (err) {
      console.error(`Error removing column city_id:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'district_id', function (err) {
    if (err) {
      console.error(`Error removing column district_id:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'ward_id', function (err) {
    if (err) {
      console.error(`Error removing column ward_id:`, err);
      return callback(err);
    }
    callback();
  });

  db.removeColumn(tableName, 'address', function (err) {
    if (err) {
      console.error(`Error removing column address:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'warehouse_type', function (err) {
    if (err) {
      console.error(`Error removing column warehouse_type:`, err);
      return callback(err);
    }
    callback();
  });
};