import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class Create {
    // @IsString()
    // @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số' })
    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name: string;
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email: string;
    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^(0|\+84)[0-9]{9}$/, { message: 'Số điện thoại không đúng định dạng' })
    phone!: string;
    active?: number;
    // @IsNotEmpty({ message: 'Vui lòng chọn Loại hình kinh doanh' })
    business_type_id: number;
    created_id?: number
    url?: string;
    description?: string;
    shop_owner?: string;
    certificate_code?: string;
    business_owner?: string;
    identity_type?: number;
    identity_code?: string;
    personal_PIT?: string;
    @IsNotEmpty({ message: 'Vui lòng nhập password' })
    password?: string
    warehouse_type?: number;
    // seller address
    is_warehouse_address?: boolean;
    seller_city_id?: number;
    seller_district_id?: number;
    seller_ward_id?: number;
    seller_address?: string;
    //warehouse address
    warehouse_city_id?: number;
    warehouse_district_id?: number;
    warehouse_ward_id?: number;
    warehouse_address?: string;
    longitude?: number;
    latitude?: number;

    branch_name?: string;
    is_default?: number;
    publish?: number | boolean;
    //seller bank
    bank_city_id?: number;
    bank_id?: number;
    bank_branch?: string;
    account_name?: string;
    account_number?: string
    // seller category
    category_id?: number[];
    constructor(
        email: string, name: string, phone: string, active: number, business_type_id: number, created_id?: number, url?: string, description?: string, 
        shop_owner?: string, certificate_code?: string, business_owner?: string, identity_type?: number, password?: string, identity_code?: string,
        warehouse_type?: number, 
        seller_city_id?: number,
        seller_district_id?: number,
        seller_ward_id?: number,
        seller_address?: string,
        warehouse_city_id?: number,
        warehouse_district_id?: number,
        warehouse_ward_id?: number,
        warehouse_address?: string,
        longitude?: number,
        latitude?: number,
        bank_city_id?: number,
        bank_id?: number,
        account_name?: string,
        account_number?: string,
        category_id?: number[],
        branch_name?: string,
        is_default?: number,
        publish?: number | boolean,
        bank_branch?: string

    ) {
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.active = active;
        this.business_type_id = business_type_id;
        this.created_id = created_id;
        this.url = url;
        this.description = description
        this.shop_owner= shop_owner
        this.certificate_code = certificate_code
        this.business_owner = business_owner
        this.identity_type = identity_type
        this.password = password
        this.identity_code = identity_code
        this.warehouse_type = warehouse_type
        this.seller_city_id = seller_city_id,
        this.seller_district_id = seller_district_id,
        this.seller_ward_id = seller_ward_id,
        this.seller_address = seller_address
        this.warehouse_city_id = warehouse_city_id,
        this.warehouse_district_id = warehouse_district_id,
        this.warehouse_ward_id = warehouse_ward_id,
        this.warehouse_address = warehouse_address
        this.bank_city_id = bank_city_id
        this.bank_id = bank_id,
        this.account_name = account_name,
        this.account_number = account_number
        this.category_id = category_id
        this.branch_name = branch_name
        this.is_default = is_default
        this.publish = publish
        this.bank_branch = bank_branch
        this.longitude = longitude
        this.latitude = latitude
    }

}