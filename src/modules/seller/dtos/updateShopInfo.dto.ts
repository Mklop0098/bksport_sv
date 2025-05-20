import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class UpdateShopInfoDto {
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
    @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không đúng định dạng' })
    phone!: string;
    @IsNotEmpty({ message: 'Tên Tỉnh/thành không được để trống' })
    city_id?: number;
    @IsNotEmpty({ message: 'Tên Quận/huyện không được để trống' })
    district_id?: number;
    @IsNotEmpty({ message: 'Tên Phường/xã được để trống' })
    ward_id?: number;
    @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
    address?: string;

    constructor(
        email: string, name: string, phone: string,
        city_id?: number,
        district_id?: number,
        ward_id?: number,
        address?: string,
    ) {
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.city_id = city_id,
        this.district_id = district_id,
        this.ward_id = ward_id,
        this.address = address
        
    }

}