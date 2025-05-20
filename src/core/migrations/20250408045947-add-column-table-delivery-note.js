'use strict';

let tableName = 'delivery_note';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'type', { type: 'string', defaultValue: 'xuat_kho_ban_le' }, function (err) {
    if (err) {
      console.error(`Error adding column type:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'from_branch', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column from_branch:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'to_branch', { type: 'int' }, function (err) {
    if (err) {
      console.error(`Error adding column to_branch:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'status', { type: 'string', defaultValue: 'tao_moi' }, function (err) {
    if (err) {
      console.error(`Error adding column status:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'export_at', { type: 'TIMESTAMP', notNull: false }, function (err) {
    if (err) {
      console.error(`Error adding column export_at:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'description', { type: 'text' }, function (err) {
    if (err) {
      console.error(`Error adding column description:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'from_branch', function (err) {
    if (err) {
      console.error(`Error removing column from_branch:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'type', function (err) {
    if (err) {
      console.error(`Error removing column type:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'status', function (err) {
    if (err) {
      console.error(`Error removing column status:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'to_branch', function (err) {
    if (err) {
      console.error(`Error removing column to_branch:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'export_at', function (err) {
    if (err) {
      console.error(`Error removing column export_at:`, err);
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