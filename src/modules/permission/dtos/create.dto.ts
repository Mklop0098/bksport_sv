import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator";

export class CreateDto {
    id?: number;

    @IsNotEmpty()
    @IsNumber()
    module_detail_id: number;

    @IsNotEmpty()
    @IsNumber()
    status: boolean;

    @IsNotEmpty()
    @IsNumber()
    role_id: number;
    created_id: number;

    constructor(id: number, status: boolean, created_id: number, module_detail_id: number, role_id: number) {
        this.id = id;
        this.status = status;
        this.created_id = created_id;
        this.module_detail_id = module_detail_id;
        this.status = status;
        this.role_id = role_id;
    }
}