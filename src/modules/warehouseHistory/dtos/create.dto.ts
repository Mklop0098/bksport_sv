import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateDto {

    // id	product_id	supplier_id	branch_id	quantity	created_id	seller_id	created_at	updated_at	
    id?: number;
    product_id?: number;
    bill_code?: string;
    branch_id?: number;
    quantity_after?: number;
    created_id?: number;
    quantity_before?: number;
    created_at?: Date;
    updated_at?: Date;
    quantity?: number;
    type?: string;
    seller_id?: number;
    note?: string;

    constructor(id?: number, product_id?: number, supplier_id?: number, branch_id?: number, quantity_after?: number, created_id?: number, quantity_before?: number, created_at?: Date, updated_at?: Date) {
        this.id = id;
        this.product_id = product_id;
        this.branch_id = branch_id;
        this.quantity_after = quantity_after;
        this.created_id = created_id;
        this.quantity_before = quantity_before;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
}