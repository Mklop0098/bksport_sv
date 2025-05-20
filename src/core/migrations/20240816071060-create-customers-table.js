exports.up = function (db, callback) {
    db.createTable('customers', {
        id: { type: 'int', notNull: true, autoIncrement: true, primaryKey: true },
        code: { type: 'string', length: 8, unique: true },
        name: { type: 'string', length: 255, notNull: true, },
        phone: { type: 'string', length: 10, },
        email: { type: 'string', length: 255, unique: true },
        birthdate: { type: 'date', comment: 'Ngày sinh' },
        gender: { type: 'int', default: 2, comment: 'Giới tính 0: Nam, 1: Nữ 2: Khác' },
        group_id: { type: 'int', comment: 'ID nhóm khách hàng' },
        group_code: { type: 'string', length: 8, comment: 'Mã nhóm khách hàng' },
        type: { type: 'boolean', defaultValue: true, comment: 'Loại khách hàng 0: cá nhân, 1: doanh nghiệp' },
        publish: { type: 'boolean', defaultValue: true },
        tax_code: { type: 'string', length: 255 },
        city_id: { type: 'int', comment: 'ID thành phố' },
        district_id: { type: 'int', comment: 'ID quận huyện' },
        ward_id: { type: 'int', comment: 'ID phường xã' },
        address: { type: 'text' },
        manager_id: { type: 'int', comment: 'ID người quản lý' },
        created_id: { type: 'int', notNull: true },
        created_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
        updated_at: { type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    }, function (err) {
        if (err) {
            console.error('err create customers table:', err);
            return callback(err);
        }
        //console.log('customers table created successfully');
        callback();
    });
};

exports.down = function (db, callback) {
    db.dropTable('customers', function (err) {
        if (err) {
            console.error('err drop customers table:', err);
            return callback(err);
        }
        //console.log('customers table drop successfully');
        callback();
    });
};