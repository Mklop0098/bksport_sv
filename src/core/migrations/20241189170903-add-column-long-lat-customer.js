'use strict';

let tableName = 'customers';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'longitude', {
    type: 'float',
    defaultValue: 0,
  }, function (err) {
    if (err) {
      console.error('err adding longitude to ' + tableName + ' table:', err);
      return callback(err);
    }

    db.addColumn(tableName, 'latitude', {
      type: 'float',
      defaultValue: 0,
    }, function (err) {
      if (err) {
        console.error('err adding latitude to ' + tableName + ' table:', err);
        return callback(err);
      }
      //console.log('longitude and latitude added successfully to ' + tableName);
      callback();
    });
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'longitude', function (err) {
    if (err) {
      console.error('err removing longitude from ' + tableName + ' table:', err);
      return callback(err);
    }

    db.removeColumn(tableName, 'latitude', function (err) {
      if (err) {
        console.error('err removing latitude from ' + tableName + ' table:', err);
        return callback(err);
      }
      //console.log('longitude and latitude removed successfully from ' + tableName);
      callback();
    });
  });
};
