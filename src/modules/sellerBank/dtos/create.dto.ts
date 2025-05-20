import { IsNotEmpty, IsString, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    seller_id?: number;
    city_id?: number;
    @IsNotEmpty({ message: 'Vui lòng chọn ngân hàng' })
    bank_id?: number;
    @IsNotEmpty({ message: 'Vui lòng nhập tên tài khoản ngân hàng' })
    @IsString()
    account_name?: string;
    @IsString()
    @IsNotEmpty({ message: 'Vui lòng nhập số tài khoản' })
    account_number?: string
    is_default?: number
    bank_branch?: string
    constructor(id: number, seller_id: number, city_id: number, bank_id?: number, account_name?: string, account_number?: string, is_default?: number, bank_branch?: string ) {
        this.id = id;
        this.seller_id =seller_id;
        this.city_id = city_id;
        this.bank_id = bank_id;
        this.account_name = account_name;
        this.account_number = account_number;
        this.is_default = is_default;
        this.bank_branch = bank_branch;
    }
}
