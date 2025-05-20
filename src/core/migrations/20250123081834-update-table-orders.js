'use strict';

exports.up = function (db) {
  return db.changeColumn('orders', 'code', {
      type: 'string',        // Specify the new data type
      length: 20,           // Optional: set the length for the string
      notNull: true         // Optional: enforce NOT NULL constrain  // Optional: set a default value
  });
};

exports.down = function (db) {
  return db.changeColumn('orders', 'code', {
      type: 'string',        // Revert to the original data type
      length: 10,           // Optional: original length
      notNull: true,        // Optional: remove NOT NULL constraint  // Optional: remove the default value
  });
};
