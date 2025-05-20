import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;

    publish?: boolean | number;

    created_id?: number;

    code?: string;

    is_default?: boolean | number;
    seller_id?: number;
    warehouse_type?: number;
    city_id?: number;
    district_id?: number;
    ward_id?: number;
    address?: string;
    latitude?: number;
    longitude?: number;

    constructor(id: number, name: string, publish: boolean, created_id?: number, code?: string, is_default?: boolean, seller_id?: number, warehouse_type?: number, city_id?: number, district_id?: number, ward_id?: number, address?: string, latitude?: number, longitude?:number) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.code = code;
        this.is_default = is_default;
        this.seller_id = seller_id;
        this.warehouse_type = warehouse_type;
        this.city_id = city_id;
        this.district_id = district_id;
        this.ward_id = ward_id;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude
    }
}