import { IsNotEmpty, IsString, Matches } from "class-validator";

export class Create {
    code: string;
    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name: string;
    // @IsNotEmpty({ message: 'Email không được để trống' })
    // @IsEmail({}, { message: 'Email không đúng định dạng' })
    email?: string;
    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không đúng định dạng' })
    phone!: string;
    address?: string;
    note: string;
    active: number;
    type!: string;
    seller_id?: number
    branch_id?: number
    created_id?: number


    constructor(code: string, email: string, name: string, phone: string, address: string, note: string, active: number, type: string, seller_id?: number, branch_id?: number, created_id?: number) {
        this.code = code;
        this.email = email;
        this.name = name;
        this.phone = phone;
        this.address = address;
        this.note = note;
        this.active = active;
        this.type = type;
        this.seller_id = seller_id;
        this.branch_id = branch_id;
        this.created_id = created_id;
    }
}