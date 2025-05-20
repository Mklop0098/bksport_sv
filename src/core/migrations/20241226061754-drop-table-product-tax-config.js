'use strict';

var dbm;
var type;
var seed;

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  db.dropTable('product_tax_config', function (err) {
    if (err) {
      console.error(`Error drop table product_tax_config`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function(db) {
  db.createTable('product_tax_config', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    product_id: { type: 'int', notNull: true },
    tax_vat_in: { type: 'int' },
    tax_vat_out: { type: 'int' },
    tax_product_apply: {type: 'boolean', defaultValue: 0},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
}, callback);
};

exports._meta = {
  "version": 1
};
