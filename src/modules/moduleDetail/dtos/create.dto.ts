import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name?: string;

    @IsNotEmpty()
    @IsNumber()
    module_id?: number;

    @IsNotEmpty()
    @IsString()
    action?: string;

    @IsNotEmpty()
    @IsNumber()
    sort?: number;
    created_id?: number;
    seller_id?: number;

    constructor(id?: number, name?: string, created_id?: number, module_id?: number, action?: string, sort?: number) {
        this.id = id;
        this.name = name;
        this.created_id = created_id;
        this.module_id = module_id;
        this.action = action;
        this.sort = sort;
    }
}