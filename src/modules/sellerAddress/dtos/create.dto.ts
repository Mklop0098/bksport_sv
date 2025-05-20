import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";

export class CreateDto {
    id?: number;
    seller_id?: number;
    city_id?: number;
    district_id?: number;
    ward_id?: number;
    address?: string;
    is_default?: number;

    constructor(id?: number, seller_id?: number, city_id?: number, district_id?: number, ward_id?: number, address?: string, is_default?: number ) {
        this.id = id;
        this.seller_id =seller_id;
        this.city_id = city_id;
        this.district_id = district_id;
        this.ward_id = ward_id;
        this.address = address
        this.is_default = is_default
    }
}
