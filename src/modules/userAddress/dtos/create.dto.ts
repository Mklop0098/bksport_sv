import { IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateDto {
    id?: number;
    user_id?: number;
    name?: string;
    @IsString()
    @Matches(/^(0|\+84)([0-9]{9})$/, { message: 'Số điện thoại không đúng định dạng' })
    phone?: string;
    city_id?: number;
    city_name?: string;
    district_id?: number;
    district_name?: string;
    ward_id?: number;
    ward_name?: string;
    address?: string;
    publish?: number;
    created_id?: number;
    created_at?: Date;
    updated_at?: Date;
    @IsNotEmpty({ message: 'Customer ID không được để trống' })
    customer_id?: number;
    is_default?: number;
    seller_id?: number;

    constructor(id?: number, user_id?: number, name?: string, phone?: string, city_id?: number, city_name?: string, district_id?: number, district_name?: string, ward_id?: number, ward_name?: string, address?: string, publish?: number, created_id?: number, created_at?: Date, updated_at?: Date, customer_id?: number, is_default?: number, seller_id?: number) {
        this.id = id;
        this.user_id = user_id;
        this.name = name;
        this.phone = phone;
        this.city_id = city_id;
        this.city_name = city_name;
        this.district_id = district_id;
        this.district_name = district_name;
        this.ward_id = ward_id;
        this.ward_name = ward_name;
        this.address = address;
        this.publish = publish;
        this.created_id = created_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.customer_id = customer_id;
        this.is_default = is_default;
        this.seller_id = seller_id;
    }
}