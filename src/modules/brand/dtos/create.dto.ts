import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;
    publish: boolean;
    seller_id?: number;

    created_id?: number;    
    constructor(id: number, name: string, publish: boolean, created_id?: number, seller_id?: number) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.seller_id = seller_id;
    }
}