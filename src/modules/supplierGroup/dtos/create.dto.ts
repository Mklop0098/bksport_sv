import errorMessages from "@core/config/constants";
import { IsNotEmpty, IsOptional, IsString , Matches} from "class-validator";

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
    seller_id?: number;

    constructor(id: number, name: string, publish: boolean, created_id?: number, code?: string, seller_id?: number) {
        this.id = id;
        this.name = name;
        this.publish = publish;
        this.created_id = created_id;
        this.code = code;
        this.seller_id = seller_id;
    }
}