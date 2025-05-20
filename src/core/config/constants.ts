const errorMessages = {
    // warehouse 
    NOT_ENOUGH_INVENTORY: "Số lượng sản phẩm có thể bán không đủ",
    INVALID_WAREHOUSE_QTY: "Số lượng sản phẩm trong kho không đủ",
    // login 
    ACCESS_DENIED: "Bạn không có quyền đăng nhập",
    ACCOUNT_NOT_ACTIVE: "Tài khoản chưa được kích hoạt",
    //seller business type id
    MISSING_BUSINESS_TYPE_ID: "Vui lòng chọn loại hình kinh doanh",

    //seller category
    MIN_QUANTITY: "Phải có ít nhất một ngành hàng chủ lực",
    //follow
    ALREADY_FOLLOW: "Đã theo dõi nhà bán này",
    FOLLOW_ERROR: "Theo dõi thất bại",
    UNFOLLOW_ERROR: "Hủy theo dõi thất bại",
    FOLLOW_SUCCESS: "Theo dõi thành công",
    FOLLOW_NOT_EXISTED: "Nhà bán chưa được theo dõi",
    // tax
    MISSING_TAX_INPUT: "Thông tin thuế không được để trống",
    // notifi
    CREATE_FAILED: "Tạo thất bại",
    UPDATE_FAILED: "Cập nhật thất bại",
    DELETE_FAILED: "Xóa thất bại",
    FIND_BY_ID_FAILED: "Không tìm thấy dữ liệu",
    FIND_ALL_FAILED: "Không tìm thấy dữ liệu",
    CREATE_SUCCESS: "Tạo thành công",
    UPDATE_SUCCESS: "Cập nhật thành công",
    DELETE_SUCCESS: "Xóa thành công",
    FIND_BY_ID_SUCCESS: "Tìm thấy",
    FIND_ALL_SUCCESS: "Tìm thấy",
    NOT_FOUND: "Không tìm thấy dữ liệu",
    SUCCESS: "Thành công",
    FAILED: "Thất bại",
    UPLOAD_FAILED: "Upload thất bại",
    UPLOAD_SUCCESS: "Upload thành công",
    INVALID_FILE: "File không hợp lệ",
    FILE_NOT_FOUND: "File không tồn tại",
    LOGOUT_SUCCESS: "Đăng xuất thành công",
    LOGOUT_FAILED: "Đăng xuất thất bại",
    LOGIN_SUCCESS: "Đăng nhập thành công",
    LOGIN_FAILED: "Đăng nhập thất bại",
    REGISTER_SUCCESS: "Đăng ký thành công",
    REGISTER_FAILED: "Đăng ký thất bại",
    SEARCH_SUCCESS: "Tìm thấy",
    SEARCH_FAILED: "Không tìm thấy",
    REFRESH_TOKEN_FAILED: "Refresh token thất bại",
    STATISTICS_SUCCESS: "Thống kê thành công",
    CODE_EXISTED: "Mã đã tồn tại",
    NAME_EXIST: "Tên đã tồn tại",
    MISSING_NAME: "Tên không được để trống",
    MISSING_CODE: "Mã không được để trống",
    MISSING_ID: "ID không được để trống",
    MISSING_EMAIL: "Email không được để trống",
    MISSING_PHONE: "Số điện thoại không được để trống",
    MISSING_PASSWORD: "Mật khẩu không được để trống",
    MISSING_USERNAME: "Tên đăng nhập không được để trống",
    MISSING_AVATAR: "Ảnh đại diện không được để trống",
    MISSING_WEIGHT: "Trọng lượng không được để trống",
    MISSING_UNIT: "Đơn vị không được để trống",
    MISSING_DESCRIPTION: "Mô tả không được để trống",
    MISSING_IS_SELL: "Trạng thái không được để trống",
    MISSING_PRODUCT_TYPE_ID: "Loại sản phẩm không được để trống",
    MISSING_BRAND_ID: "Thương hiệu không được để trống",
    MISSING_RETAIL_PRICE: "Giá bán lẻ không được để trống",
    MISSING_WHOLESALE_PRICE: "Giá bán sỉ không được để trống",
    MISSING_IMPORT_PRICE: "Giá nhập không được để trống",
    MISSING_IMAGE: "Ảnh không được để trống",
    INVALID_FILE_QUANTITY: "Số lượng ảnh không hợp lệ",
    INVALID_FILE_NAME: "Tên file không hợp lệ",
    UPDATE_ADDRESS_SUCCESS: "Cập nhật địa chỉ thành công",
    UPDATE_ADDRESS_FAILED: "Cập nhật địa chỉ thất bại",
    CANNOT_UPDATE_ADDRESS: "Không thể cập nhật địa chỉ",
    CANNOT_DELETE_ADDRESS: "Không thể xóa địa chỉ",
    DELETE_ADDRESS_SUCCESS: "Xóa địa chỉ thành công",
    ADDRESS_DEFAULT_REQUIRED: "Phải có ít nhất một địa chỉ mặc định",
    STATUS_MAX: "Trạng thái không được lớn hơn 5",
    UPDATE_STATUS_SUCCESS: "Cập nhật trạng thái thành công",
    UPDATE_STATUS_FAILED: "Cập nhật trạng thái thất bại",
    CODE_LENGTH: "Mã vượt quá giới hạn",
    GROUP_DEFAULT_REQUIRED: "Phải có ít nhất một nhóm mặc định",
    CANNOT_DELETE_GROUP: "Không thể xóa nhóm khách hàng này",
    CODE_LENGTH_INPUT: "Mã phải là 8 ký tự",
    PHONE_REQUIRED: "Số điện thoại không được để trống",
    CANNOT_DELETE_DATA_DEFAULT: "Không thể xóa dữ liệu mặc định",


    // validate
    INVALID_ID: "ID không hợp lệ",
    INVALID_NAME: "Tên không hợp lệ",
    INVALID_PAGE_LIMIT: "page, limit không hợp lệ",
    INVALID_LIMIT: "Trường limit không hợp lệ",
    INVALID_EMAIL: "Email không hợp lệ",
    INVALID_PHONE: "Số điện thoại không hợp lệ",
    INVALID_PASSWORD: "Mật khẩu không hợp lệ",
    INVALID_STATUS: "Trạng thái không hợp lệ",
    INVALID_PARAMS: "Tham số không hợp lệ",
    MISSING_PARAMS: "Thiếu tham số",
    PHONE_NOT_VALID: "Số điện thoại không hợp lệ",
    SUPPLIER_NOT_EXISTED:"Nhà cung cấp không tồn tại",

    // exist
    EMAIL_EXISTED: "Email đã tồn tại",
    PHONE_EXISTED: "Số điện thoại đã tồn tại",
    TAX_CODE_EXISTED: "Mã số thuế đã tồn tại",
    TAX_CODE_NOT_EXISTED: "Mã số thuế không tồn tại",
    USERNAME_EXISTED: "Tên đăng nhập đã tồn tại",
    USERNAME_NOT_EXISTED: "Tên đăng nhập không tồn tại",
    EMAIL_NOT_EXISTED: "Email không tồn tại",
    PHONE_NOT_EXISTED: "Số điện thoại không tồn tại",
    PASSWORD_NOT_EXISTED: "Mật khẩu không tồn tại",
    PASSWORD_INCORRECT: "Mật khẩu không chính xác",
    MODEL_IS_EMPTY: "Model không tồn tại",
    AVATAR_NOT_EXISTED: "Ảnh đại diện không tồn tại",
    EXISTED: "Đã tồn tại",
    NOT_EXISTED: "Không tồn tại",
    PRODUCT_TYPE_NOT_EXISTED: "Loại sản phẩm không tồn tại",
    BRAND_NOT_EXISTED: "Thương hiệu không tồn tại",
    NAME_EXISTED: "Tên đã tồn tại",
    PRODUCT_NOT_EXISTED: "Sản phẩm không tồn tại",
    PRODUCT_COMMISSION_EXISTED: "Hoa hồng của sản phẩm đã tồn tại",

    // auth
    INVALID_USERNAME: "Tên đăng nhập không hợp lệ",
    INVALID_FULLNAME: "Họ tên không hợp lệ",
    INVALID_TOKEN: "Token không hợp lệ",
    REFRESH_TOKEN_NOT_EXISTED: "Refresh token không tồn tại",
    CHANGE_PASSWORD_FAILED: "Thay đổi mật khẩu thất bại",
    CHANGE_PASSWORD_SUCCESS: "Thay đổi mật khẩu thành công",
    REFRESH_TOKEN_SUCCESS: "Refresh token thành công",
    USER_BLOCKED: "Tài khoản đã bị khóa",

    //cccd
    INVALID_CCCD: "CCCD không hợp lệ",
    REQUIRED_CCCD: "CCCD thì bắt buộc",
    CARD_FRONT_IMAGE_NOT_EXISTED: "Ảnh mặt trước CCCD không tồn tại",
    CARD_BACK_IMAGE_NOT_EXISTED: "Ảnh mặt sau CCCD không tồn tại",

    // group
    GROUP_EXISTED: "Nhóm đã tồn tại",
    GROUP_NOT_EXISTED: "Nhóm không tồn tại",
    GROUP_NAME_EXISTED: "Tên nhóm đã tồn tại",
    GROUP_NAME_NOT_EXISTED: "Tên nhóm không tồn tại",

    //service package
    SERVICE_PACKAGE_EXISTED: "Gói dịch vụ đã tồn tại",
    SERVICE_PACKAGE_NOT_EXISTED: "Gói dịch vụ không tồn tại",
    SERVICE_PACKAGE_NAME_EXISTED: "Tên gói dịch vụ đã tồn tại",
    SERVICE_PACKAGE_NAME_NOT_EXISTED: "Tên gói dịch vụ không tồn tại",

    //excel
    OVER_LIMIT: "Vượt quá giới hạn",
    MAX_ROW_EXCEL: "File excel vượt quá giới hạn",
    IMPORT_SUCCESS: "Import thành công",
    IMPORT_FAILED: "Import thất bại",
    EXPORT_SUCCESS: "Export thành công",

    // files
    INVALID_FILE_SIZE: "File quá lớn",
    PRODUCT_NAME_EXISTED: "Tên sản phẩm đã tồn tại",
    LIMIT_FILE_SIZE: "File quá lớn",
    FILE_TYPE_INVALID: "File không hợp lệ",
    FILE_OVER_LIMIT: "Ảnh vượt quá số lượng cho phép",
    CREATE_FOLDER_FAILED: "Tạo thư mục thất bại",

    //order
    ORDER_STATUS_NEW: "Đơn hàng mới",
    ORDER_STATUS_PROCESSING: "Đã duyệt",
    ORDER_STATUS_PACKING: "Đang đóng gói",
    ORDER_STATUS_WAITING: "Chờ lấy hàng",
    ORDER_STATUS_DELIVERING: "Đang giao",
    // ORDER_STATUS_DELIVERING: "Đang giao",
    ORDER_STATUS_DELIVERED: "Hoàn thành",
    ORDER_STATUS_CANCEL: "Đã hủy",
    ORDER_STATUS_RETURN: "Đã trả hàng",
    ORDER_STATUS_REFUND: "Đã hoàn tiền",
    ORDER_STATUS_NOT_EXISTED: "Trạng thái đơn hàng không tồn tại",
    ORDER_NOT_EXISTED: "Đơn hàng không tồn tại",
    ORDER_EXISTED: "Đơn hàng đã tồn tại",
    ORDER_STATUS_INVALID: "Trạng thái đơn hàng không hợp lệ",
    ORDER_STATUS_NOT_ALLOW: "Không thể thay đổi trạng thái đơn hàng",
    ORDER_APPROVE_NOT_UPDATE: "Đơn hàng đã duyệt không thể cập nhật",
    ORDER_STATUS_COMPLETED_OR_CANCEL: "Đơn hàng đã hoàn thành hoặc đã hủy",
    ORDER_CUSTOMER_ID: "Khách hàng không được để trống",
    NAME_NOT_EXISTED: "Tên không được để trống",
    ADDRESS_NOT_EXISTED: "Địa chỉ không được để trống",
    ORDER_STASTUS_COMPLETED: "Đơn hàng đã hoàn thành",
    ORDER_STASTUS_CANCEL: "Đơn hàng đã hủy",
    ORDER_STASTUS_NOT_PAYMENT: "Đơn hàng chưa thanh toán, không thể hoàn thành",
    STATUS_PAYMENT_0: "Chưa thanh toán",
    STATUS_PAYMENT_1: "Đã thanh toán",
    STATUS_PAYMENT_2: "Chờ thanh toán",
    INVALID_LIST_ORDER_DELIVERY: "Danh sách không hợp lệ, chỉ xuất kho với những đơn hàng ở trạng thái đã đóng gói",
    INVALID_LIST_STATUS_UPDATE: "Danh sách không hợp lệ, vui lòng chọn lại",

    //order detail
    PRICE_INVALID: "Giá không hợp lệ",
    QUANTITY_INVALID: "Số lượng không hợp lệ",
    DISCOUNT_TYPE_INVALID: "Loại giảm giá không hợp lệ",
    INVALID_STATUS_UPDATE: "Trạng thái không hợp lệ",

    //discount 
    DISCOUNT_TYPE_0: "Không có",
    DISCOUNT_TYPE_1: "%",
    DISCOUNT_TYPE_2: "Tiền mặt",
    DISCOUNT_VALUE_NOT_EXISTED: "Giá trị giảm giá không tồn tại",
    DISCOUNT_VALUE_INVALID: "Giá trị giảm giá không hợp lệ",
    DISCOUNT_TYPE_NOT_EXISTED: "Loại giảm giá không tồn tại",

    //product
    PRICE_MUST_GREATER_THAN_ZERO: "Giá bán không hợp lệ",
    UNIT_NOT_EXISTED: "Đơn vị không tồn tại",
    PRICE_WHOLESALE_CANNOT_NULL: "Giá bán sỉ không được để trống",
    PRICE_RETAIL_CANNOT_NULL: "Giá bán lẻ không được để trống",
    ALLOW_SELL: "Cho phép bán",
    NOT_ALLOW_SELL: "",
    PRICE_SALE_GREATER_THAN_PRICE: "Giá khuyến mãi không được lớn hơn giá bán lẻ",

    //city
    CITY_NOT_EXISTED: "Thành phố không tồn tại",
    CITY_EXISTED: "Thành phố đã tồn tại",
    CITY_NAME_EXISTED: "Tên thành phố đã tồn tại",
    CITY_NAME_NOT_EXISTED: "Tên thành phố không tồn tại",

    //district
    DISTRICT_NOT_EXISTED: "Quận huyện không tồn tại",
    DISTRICT_EXISTED: "Quận huyện đã tồn tại",
    DISTRICT_NAME_EXISTED: "Tên quận huyện đã tồn tại",
    DISTRICT_NAME_NOT_EXISTED: "Tên quận huyện không tồn tại",

    //ward
    WARD_NOT_EXISTED: "Xã phường không tồn tại",
    WARD_EXISTED: "Xã phường đã tồn tại",
    WARD_NAME_EXISTED: "Tên xã phường đã tồn tại",
    WARD_NAME_NOT_EXISTED: "Tên xã phường không tồn tại",

    //shipping
    SHIP_METHOD_2: 'Giao hàng tận nơi',
    SHIP_METHOD_1: 'Nhận hàng tại cửa hàng',
    SHIP_METHOD_3: 'Nhận hàng tại bưu điện',
    SHIP_METHOD_4: 'Nhận hàng tại điểm giao hàng',
    SHIP_METHOD_NOT_EXISTED: "Phương thức giao hàng không tồn tại",

    //payment
    PAYMENT_METHOD_1: 'Tiền mặt',
    PAYMENT_METHOD_2: 'Chuyển khoản',
    PAYMENT_METHOD_3: 'Quẹt thẻ',
    PAYMENT_METHOD_4: 'Thanh toán qua ví điện tử',
    PAY_METHOD_NOT_EXISTED: "Phương thức thanh toán không tồn tại",

    //role
    ROLE_NOT_EXISTED: "Quyền không tồn tại",
    USER_NOT_EXISTED: "Người dùng không tồn tại",
    ROLE_EXISTED: "Quyền đã tồn tại",
    UPDATE_ROLE_FAILED: "Cập nhật quyền thất bại",
    CREATE_ROLE_FAILED: "Tạo quyền thất bại",

    // delivery note
    DELIVERY_NOTE_NOT_REQUIRED: "Phiếu xuất yêu cầu",
    QTY_NOT_VALID: "Số lượng không hợp lệ",
    DELIVERY_SUCCESS: "Xuất kho thành công",
    ORDER_STATUS_NOT_PROCESSING: "Đơn hàng không ở trạng thái xử lý",


    //action history
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    UPDATE_STATUS: 'update status',
    UPDATE_LIST_STATUS: 'update list status',
    DELETE_LIST: 'delete list',

    //role
    NOT_ADMIN: "Không phải admin",
    CHECK_SUCCESS: "Kiểm tra thành công",

    //commission
    COMMISSION_EXISTED: "Hoa hồng đã tồn tại",
    INVALID_DATE: "Khoảng thời gian chưa hợp lệ",
    EMPLOYEE_ID_REQUIRED: "Vui lòng chọn nhân viên",
    FROM_DATE_REQUIRED: "Vui lòng chọn ngày bắt đầu",
    TO_DATE_REQUIRED: "Vui lòng chọn ngày kết thúc",


    ORDER_CANCELED: "Đơn hàng đã bị hủy không thể chỉnh sửa",
    ORDER_COMPLETED: "Đơn hàng đã hoàn thành không thể chỉnh sửa",
    MISSING_FIELDS: "product_id, order_id không được để trống",

    PURCHASE_COMPLETED: "Đơn hàng đã hoàn thành không thể chỉnh sửa",
    PURCHASE_CANCELED: "Đơn hàng đã bị hủy không thể chỉnh sửa",




    //sort
    SORT_EXISTED: "Thứ tự đã tồn tại",
    //validate
    NAME_REQUIRED: "Tên không được để trống",
    //slugs
    SLUG_NOT_FOUND: "Không tìm thấy slug",
    FILE_REQUIRED: "Ảnh không được để trống",

    PRICE_SALE_INVALID: "Giá giảm không được lớn hơn giá",





    // action
    ACTION_CREATE: "Thêm",
    ACTION_UPDATE: "Sửa",
    ACTION_DELETE: "Xóa",
    ACTION_INDEX: "Xem",
    ACTION_IMPORT: "Nhập Excel",

    ACTION_CREATE_VALUE: "create",
    ACTION_UPDATE_VALUE: "update",
    ACTION_DELETE_VALUE: "delete",
    ACTION_INDEX_VALUE: "index",
    ACTION_IMPORT_VALUE: "import",
    INVALID_ACTION: "Hành động không hợp lệ",
    PERMISSION_DENIED: "Không có quyền truy cập",
    PERMISSION_GRANTED: "Đã cấp quyền truy cập",

    //role
    ROLE_ADMIN_NAME: "Admin",
    ROLE_USER_NAME: "User",
    ROLE_DEV_NAME: "Dev",
    ROLE_MAKETING_NAME: "Marketing",
    ROLE_SALE_NAME: "Sale",
    ROLE_EMPLOYEE_NAME: "Employee",
    INVALID_ROLE_ID: "Role không hợp lệ",


    ACTION_PUBLISH_VALUE: "publish",
    ACTION_PUBLISH: "Hiển thị",
    ACTION_STATUS: "Trạng thái",
    ACTION_EXPORT: "Xuất Excel",
    ACTION_EXPORT_VALUE: "export",
    ACTION_REPORT: "Xem báo cáo",
    ACTION_REPORT_VALUE: "report",

    PURCHASE_STATUS_CREATE: "Chờ duyệt",
    PURCHASE_STATUS_IMPORT: "Đã nhập kho",
    PURCHASE_STATUS_COMPLETED: "Hoàn thành",
    PURCHASE_STATUS_CANCEL: "Hủy",
    PURCHASE_STATUS_APPROVE: "Chờ xác nhận",
    PURCHASE_STATUS_NOT_APPROVE: "Không được duyệt",
    PURCHASE_STATUS_CONFIRM: "Chờ nhập kho",
    PURCHASE_STATUS_NOT_CONFIRM: "Không xác nhận",

    MISSING_DATA: "Thiếu dữ liệu",
    SELLER_NOT_FOUND: "Nhà bán không tồn tại",

    PURCHASE_STATUS_INVALID: "Trạng thái đơn hàng không hợp lệ",
    PURCHASE_STATUS_NOT_ALLOW: "Không thể thay đổi trạng thái đơn hàng",
    PURCHASE_STATUS_PAYMENT_INVALID: "Trạng thái thanh toán không hợp lệ",
    PURCHASE_MONEY_INVALID: "Số tiền không hợp lệ",
    PURCHASE_LIST_ORDER_IMPORT_INVALID: "Danh sách không hợp lệ, chỉ nhập hàng với những đơn hàng ở trạng thái tạo đơn",
    PURCHASE_LIST_STATUS_UPDATE_INVALID: "Danh sách không hợp lệ, vui lòng chọn lại",
    PURCHASE_LIST_STATUS_COMPLETE_INVALID: "Danh sách không hợp lệ, chỉ hoàn thành với những đơn hàng ở trạng thái nhập hàng đã thanh toán",
    UPDATE_STATUS_PAYMENT_FAILED: "Cập nhật trạng thái thanh toán thất bại",
}

export default errorMessages;