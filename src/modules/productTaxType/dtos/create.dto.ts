import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên không được để trống' })
    name: string;
    @IsString()
    @IsNotEmpty({ message: 'Mã không được để trống' })
    code: string;
    @IsNotEmpty({ message: 'Thuế suất không được để trống' })
    tax_value: number;
    seller_id?: number
    created_id?: number


    constructor(name: string, code: string, tax_value: number, seller_id?: number, created_id?: number) {
        this.name = name;
        this.code = code;
        this.tax_value = tax_value;
        this.seller_id = seller_id;
        this.created_id = created_id;
    }
}