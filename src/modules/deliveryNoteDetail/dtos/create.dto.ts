import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";
import errorMessages from "@core/config/constants";
export class CreateDto {
    id?: number;
    delivery_note_id: number;
    @IsNumber()
    product_id?: number;
    @IsNumber()
    @Matches(/^[0-9]+$/, { message: errorMessages.QTY_NOT_VALID })
    qty?: number;
    created_id?: number;
    created_at?: Date;
    updated_at?: Date;
    seller_id?: number
    branch_id?: number
    in_combo?: number
    combo_id?: number

    constructor(id: number, delivery_note_id: number, product_id: number, qty: number, created_id: number, seller_id: number, created_at: Date, updated_at: Date, branch_id: number, in_combo: number, combo_id: number) {
        this.id = id;
        this.delivery_note_id = delivery_note_id;
        this.product_id = product_id;
        this.qty = qty;
        this.created_id = created_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.seller_id = seller_id;
        this.branch_id = branch_id
        this.in_combo = in_combo
        this.combo_id = combo_id
    }
}


