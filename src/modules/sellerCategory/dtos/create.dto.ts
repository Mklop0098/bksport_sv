import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    seller_id?: number;
    category_id?: number[];

    constructor(id: number, seller_id: number, category_id: number[]) {
        this.id = id;
        this.seller_id =seller_id;
        this.category_id = category_id;
    }
}
