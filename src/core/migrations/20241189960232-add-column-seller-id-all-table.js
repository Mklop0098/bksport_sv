// exports.up = function (db, callback) {

//   const tables = [
//     'city',
//     'customers',
//     'customer_group',
//     'delivery_note',
//     'delivery_note_detail',
//     'district',
//     'orders',
//     'order_detail',
//     'order_status_history',
//     'product_type',
//     'ward',
//     'device_token',
//     'notification_type',
//     'brand',
//     'product_unit',
//     'supplier',
//     'role',
//     'notification',
//     'product_commission',
//     'product_image',
//     `supplier-group`,
//     'token',
//     'users',
//     'user_address',
//     'user_role',
//     'module',
//     'action_history',
//     'product',
//     'branch',
//     'purchase_order_detail',
//     'purchase_order_status_history',
//     'module_detail',
//     'purchase_order',
//     'permission',
//   ];

//   Promise.all(
//     tables.map((table) => db.addColumn(table, 'seller_id', { type: 'int', allowNull: true, defaultValue: 0 }))
//   )
//     .then(() => {
//       //console.log('seller_id columns added successfully');
//       callback();
//     })
//     .catch((err) => {
//       console.error('Error adding seller_id columns:', err);
//       callback(err);
//     });
// };