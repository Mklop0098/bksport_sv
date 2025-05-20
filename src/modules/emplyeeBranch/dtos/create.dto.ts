import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    seller_id?: number;
    branch_id?: number;
    user_id?: number;

    constructor(id: number, seller_id: number, branch_id: number, user_id: number) {
        this.id = id;
        this.seller_id =seller_id;
        this.branch_id = branch_id;
        this.user_id = user_id;
    }
}
