import { IsNotEmpty, IsString, Matches, IsOptional } from "class-validator";
import errorMessages from "@core/config/constants";
export class CreateDto {
    id?: number;
    @IsNotEmpty()
    @IsString()
    name: string;

    publish: boolean;

    created_id?: number;

    // @Matches(/^.{8}$|^$/, { message: errorMessages.CODE_LENGTH_INPUT })
    // @IsOptional()
    code?: string;

    is_default?: boolean;
    seller_id?: number;

    constructor(id: number, name: string, publish: boolean, created_id?: number, code?: string, is_default?: boolean, seller_id?: number) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.code = code;
        this.is_default = is_default;
        this.seller_id = seller_id;
    }
}