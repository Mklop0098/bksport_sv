exports.up = function (db, callback) {
  db.createTable('fields', {
    id: { type: 'int', primaryKey: true, autoIncrement: true },
    name: { type: 'varchar', notNull: true },
    code: { type: 'varchar', notNull: true },
    sport_id: { type: 'int', notNull: true },
    seller_id: { type: 'int', notNull: true },
    city_id: { type: 'int', notNull: true },
    district_id: { type: 'int', notNull: true },
    ward_id: { type: 'int', notNull: true },
    address: { type: 'varchar', notNull: true },
    price: { type: 'int', notNull: true },
    price_sale: { type: 'int', notNull: true },
    width: { type: 'int', notNull: true },
    length: { type: 'int', notNull: true },
    can_order: { type: 'int'},
    public_yomart: { type: 'int'},
    public: { type: 'int'},
    description: { type: 'varchar'},
    content: { type: 'text'}, 
    detail_info: { type: 'text'}, 
    highlights: { type: 'text'}, 
    title: { type: 'varchar'}, 
    meta_description: { type: 'varchar'}, 
    slug: { type: 'varchar'}, 
    created_id: { type: 'int'}, 
    is_topdeal: { type: 'int'}, 
    notify: { type: 'int'},
    attributes: { type: 'text'},
    created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' }
  }, function (err) {
    if (err) {
      console.error('err create fields:', err);
      return callback(err);
    }
    callback();
  });
};
exports.down = function (db, callback) {
  db.dropTable('fields', function (err) {
    if (err) {
      console.error('err drop fields:', err);
      return callback(err);
    }
    callback();
  });
};