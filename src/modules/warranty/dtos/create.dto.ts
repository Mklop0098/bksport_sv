import { IsNotEmpty } from "class-validator";
export class Create {
    @IsNotEmpty({ message: 'Thời hạn bảo hành không được để trống' })
    warranty_period: number;
    warranty_place?: string;
    warranty_form?: string;
    warranty_instructions?: string;
    product_id?: number;
    seller_id?: number
    created_id?: number


    constructor(
        warranty_period: number,
        warranty_place?: string,
        warranty_form?: string,
        warranty_instructions?: string,
        product_id?: number,
        seller_id?: number, 
        created_id?: number) 
    {
        this.warranty_period = warranty_period;
        this.warranty_place = warranty_place;
        this.warranty_form = warranty_form;
        this.warranty_instructions = warranty_instructions,
        this.product_id = product_id;
        this.seller_id = seller_id;
        this.created_id = created_id;
    }
}