import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class Create {
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, { message: 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số' })
    // @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$    /, { message: 'Mật khẩu có độ dài từ 8-20 ký tự, bao gồm ít nhất một chữ cái viết hoa, một chữ cái viết thường, một chữ số, và một ký tự đặc biệt' })
    password?: string;

    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name?: string;

    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email?: string;

    @IsString()
    @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
    @Matches(/^(0|\+84)[0-9]{9,10}$/, { message: 'Số điện thoại không đúng định dạng' })
    phone?: string;

    active?: number;

    created_id?: number

    manager_id?: number

    role_id?: number
    @IsNotEmpty({ message: 'Vui lòng chọn chi nhánh' })
    branch_id?: number[]

    user_id?: number
    seller_id?: number
    text_password?: string
    constructor(email: string, password: string, name: string, phone: string, active: number, created_id?: number, manager_id?: number, role_id?: number, user_id?: number, seller_id?: number, text_password?: string, branch_id?: number[]) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.active = active;
        this.created_id = created_id;
        this.manager_id = manager_id;
        this.role_id = role_id;
        this.user_id = user_id;
        this.seller_id = seller_id;
        this.text_password = text_password
        this.branch_id = branch_id
    }
}
