import { IsJSON, IsNotEmpty } from "class-validator";

export class CreateDto {
    id?: number;
    @IsNotEmpty({ message: 'ID sản phẩm không được trống' })
    field_id?: number;
    image?: string;
    publish?: number;
    created_id?: number;
    created_at?: Date;
    updated_at?: Date;
    seller_id?: number;

    constructor(id: number, field_id: number, image: string, publish: number, created_id: number, created_at: Date, updated_at: Date, seller_id: number) {
        this.id = id;
        this.field_id = field_id;
        this.image = image;
        this.publish = publish;
        this.created_id = created_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.seller_id = seller_id;
    }
}