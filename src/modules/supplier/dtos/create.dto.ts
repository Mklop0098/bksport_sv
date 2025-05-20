import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateDto {

    @IsString()
    @IsNotEmpty()
    name?: string;

    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    // @Matches(/^\d{1,10}$/, { message: 'Số điện thoại không đúng định dạng' })
    @Matches(/^(0|\+84)([0-9]{9})$/, { message: 'Số điện thoại không đúng định dạng' })
    phone?: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsOptional()
    email?: string;

    @IsNotEmpty()
    group_id?: number;

    @IsString()
    address?: string;

    @IsNotEmpty()
    status?: number;

    created_id?: number


    created_at?: Date
    updated_at?: Date

    city_id?: number
    city_name?: string
    district_id?: number
    district_name?: string
    ward_id?: number
    ward_name?: string
    seller_id?: number

    constructor(name: string, phone: string, email: string, group_id: number, address: string, status: number, created_at: Date, updated_at: Date, created_id?: number, city_id?: number, city_name?: string, district_id?: number, district_name?: string, ward_id?: number, ward_name?: string, seller_id?: number) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.group_id = group_id;
        this.address = address;
        this.status = status;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.created_id = created_id;
        this.city_id = city_id;
        this.city_name = city_name;
        this.district_id = district_id;
        this.district_name = district_name;
        this.ward_id = ward_id;
        this.ward_name = ward_name;
        this.seller_id = seller_id;
    }
}