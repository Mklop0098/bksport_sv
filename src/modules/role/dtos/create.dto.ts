import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;

    publish: boolean;

    created_id?: number;

    code?: string;
    seller_id?: number;

    constructor(id: number, name: string, publish: boolean, created_id?: number, code?: string) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.code = code;
    }
}