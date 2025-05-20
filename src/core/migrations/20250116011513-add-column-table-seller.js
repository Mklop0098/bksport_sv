'use strict';

let tableName = 'seller';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'avatar', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column avatar:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'background', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column background:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'join_year', { type: 'int'}, function (err) {
    if (err) {
      console.error(`Error adding column join_year:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'description', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column description:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'avatar', function (err) {
    if (err) {
      console.error(`Error removing column avatar:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'background', function (err) {
    if (err) {
      console.error(`Error removing column background:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'join_year', function (err) {
    if (err) {
      console.error(`Error removing column join_year:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'description', function (err) {
    if (err) {
      console.error(`Error removing column description:`, err);
      return callback(err);
    }
    callback();
  });
};