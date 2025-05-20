import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateDto {

    // id	product_id	supplier_id	branch_id	quantity	created_id	seller_id	created_at	updated_at	
    id?: number;
    product_id?: number;
    supplier_id?: number;
    branch_id?: number;
    quantity?: number;
    created_id?: number;
    seller_id?: number;
    created_at?: Date;
    updated_at?: Date;

    constructor(id?: number, product_id?: number, supplier_id?: number, branch_id?: number, quantity?: number, created_id?: number, seller_id?: number, created_at?: Date, updated_at?: Date) {
        this.id = id;
        this.product_id = product_id;
        this.supplier_id = supplier_id;
        this.branch_id = branch_id;
        this.quantity = quantity;
        this.created_id = created_id;
        this.seller_id = seller_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}