import { IsNotEmpty, IsString } from "class-validator";
import { CreateDto as ModuleDetailModel } from "@modules/moduleDetail/dtos/create.dto";
export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;
    publish: boolean;
    created_id?: number | undefined;
    actions?: ModuleDetailModel[];
    seller_id?: number;
    url?: string

    constructor(id: number, name: string, publish: boolean, created_id?: number, seller_id?: number, url?: string) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.seller_id = seller_id;
        this.url = url
    }
}