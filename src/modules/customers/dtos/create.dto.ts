import errorMessages from "@core/config/constants";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateDto {
    @IsString()
    STT?: string;

    // @IsString()
    // @Matches(/^.{8}$|^$/, { message: errorMessages.CODE_LENGTH_INPUT })
    // @IsOptional()
    code?: string;

    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name?: string;

    @IsString()
    @IsNotEmpty()
    @Matches(/^(0|\+84)([0-9]{9})$/, { message: 'Số điện thoại không đúng định dạng' })
    phone?: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    // @IsNotEmpty({ message: 'Email không được để trống' })
    @IsOptional()
    email?: string;

    @IsNotEmpty()
    type?: number;

    @IsNotEmpty()
    group_id?: number;

    @IsString()
    address?: string;

    birthdate?: Date;

    gender?: number;

    publish?: number;

    @IsString()
    tax_code?: string;

    created_at?: Date
    updated_at?: Date
    groupName?: string;
    created_id?: number

    city_id?: number
    district_id?: number
    ward_id?: number


    city_name?: string
    district_name?: string
    ward_name?: string
    is_default?: number
    customer_id?: number

    key?: string

    group_code?: string

    magnager_id?: number
    longitude?: number
    latitude?: number
    seller_id?: number

    constructor(code: string, name: string, phone: string, email: string, type: number, group_id: number, address: string, publish: number, tax_code: string, created_at: Date, updated_at: Date, groupName: string, birthdate?: Date, gender?: number, created_id?: number, city_id?: number, district_id?: number, ward_id?: number, city_name?: string, district_name?: string, ward_name?: string, is_default?: number, customer_id?: number, key?: string, group_code?: string, magnager_id?: number, longitude?: number, latitude?: number, seller_id?: number) {
        this.code = code;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.type = type;
        this.group_id = group_id;
        this.address = address;
        this.publish = publish;
        this.tax_code = tax_code;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.groupName = groupName;
        this.birthdate = birthdate
        this.gender = gender
        this.created_id = created_id
        this.city_id = city_id
        this.district_id = district_id;
        this.ward_id = ward_id
        this.city_name = city_name
        this.district_name = district_name
        this.ward_name = ward_name
        this.is_default = is_default
        this.customer_id = customer_id
        this.key = key
        this.group_code = group_code;
        this.magnager_id = magnager_id;
        this.longitude = longitude;
        this.latitude = latitude;
        this.seller_id = seller_id;
    }
}

