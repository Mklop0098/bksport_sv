import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    seller_id?: number;
    city_id?: number;
    name?: string;
    branch?: string;
    logo?: string;
    account_name?: string;
    account_number?: string

    constructor(id: number, seller_id: number, city_id: number, name?: string, branch?: string, account_name?: string, account_number?: string, logo?: string ) {
        this.id = id;
        this.seller_id =seller_id;
        this.city_id = city_id;
        this.name = name;
        this.branch = branch;
        this.account_name = account_name;
        this.account_number = account_number;
        this.logo = logo
    }
}
