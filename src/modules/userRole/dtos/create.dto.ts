import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number;
    user_id?: number;
    role_id?: number;
    created_id?: number;
    seller_id?: number;

    constructor(id: number, user_id: number, role_id: number, created_id: number) {
        this.id = id;
        this.user_id = user_id;
        this.role_id = role_id;
        this.created_id = created_id;
    }
}