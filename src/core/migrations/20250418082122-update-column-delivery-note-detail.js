'use strict';

exports.up = function (db) {
  return db.changeColumn('delivery_note_detail', 'in_combo', {
      type: 'int',        // Specify the new data type
      notNull: true         // Optional: enforce NOT NULL constrain  // Optional: set a default value
  });
};

exports.down = function (db) {
  return db.changeColumn('delivery_note_detail', 'in_combo', {
      type: 'boolean',        // Revert to the original data type
      notNull: true,        // Optional: remove NOT NULL constraint  // Optional: remove the default value
  });
};
