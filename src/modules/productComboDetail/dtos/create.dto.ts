import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    combo_id?: number;
    product_id?: number;
    quantity?: number;
    price?: number;
    discount_type?: number;
    discount_value?: number;
    price_combo?: number;       

    constructor(id: number, combo_id: number, product_id: number, quantity: number, price: number, discount_type: number, discount_value: number, price_combo: number) {
        this.id = id;
        this.combo_id = combo_id;
        this.product_id = product_id;
        this.quantity = quantity;
        this.price = price;
        this.discount_type = discount_type;
        this.discount_value = discount_value;
        this.price_combo = price_combo;
    }
}
