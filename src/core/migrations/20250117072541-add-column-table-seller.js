'use strict';

let tableName = 'seller';

exports.up = function (db, callback) {
  db.addColumn(tableName, 'shop_owner', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column owner:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'certificate_code', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column certificate_code:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'certificate_image', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column certificate_image:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'business_owner', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column business_owner:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'identity_type', { type: 'int', defaultValue: 0}, function (err) {
    if (err) {
      console.error(`Error adding column identity_type:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'identity_code', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column identity_code:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'identity_front_img', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column identity_front_img:`, err);
      return callback(err);
    }
    callback();
  });
  db.addColumn(tableName, 'identity_back_img', { type: 'string'}, function (err) {
    if (err) {
      console.error(`Error adding column identity_back_img:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.removeColumn(tableName, 'shop_owner', function (err) {
    if (err) {
      console.error(`Error removing column shop_owner:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'certificate_code', function (err) {
    if (err) {
      console.error(`Error removing column certificate_code:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'certificate_image', function (err) {
    if (err) {
      console.error(`Error removing column certificate_image:`, err);
      return callback(err);
    }
    callback();
  });

  db.removeColumn(tableName, 'business_owner', function (err) {
    if (err) {
      console.error(`Error removing column business_owner:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'identity_type', function (err) {
    if (err) {
      console.error(`Error removing column identity_type:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'identity_code', function (err) {
    if (err) {
      console.error(`Error removing column identity_code:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'identity_front_img', function (err) {
    if (err) {
      console.error(`Error removing column identity_front_img:`, err);
      return callback(err);
    }
    callback();
  });
  db.removeColumn(tableName, 'identity_back_img', function (err) {
    if (err) {
      console.error(`Error removing column identity_back_img:`, err);
      return callback(err);
    }
    callback();
  });
};