import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    @IsNotEmpty()
    user_id?: number
    @IsNotEmpty()
    seller_id?: number

    constructor(id: number, user_id: number, seller_id: number) {
        this.id = id,
        this.user_id = user_id
        this.seller_id = seller_id
    }
}