'use strict';

let tableName = 'category';
let oldColumnName = 'parentid';
let newColumnName = 'parent_id';

exports.up = function (db, callback) {
  db.runSql('ALTER TABLE `category` CHANGE `parentid` `parent_id` INT(11);', function (err) {
    if (err) {
      console.error(`Error rename column ${oldColumnName}:`, err);
      return callback(err);
    }
    callback();
  });
};

exports.down = function (db, callback) {
  db.runSql('ALTER TABLE `category` CHANGE `parent_id` `parentid` INT(11);', function (err) {
    if (err) {
      console.error(`Error rename column ${newColumnName}:`, err);
      return callback(err);
    }
    callback();
  });
};