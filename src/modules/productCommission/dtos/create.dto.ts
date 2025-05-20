export class CreateDto {
    id?: number;
    product_id?: number;
    commission?: number;
    publish?: number;
    created_id?: number;
    created_at?: Date;
    updated_at?: Date;
    seller_id?: number;

    constructor(id?: number, product_id?: number, commission?: number, publish?: number, created_id?: number, created_at?: Date, updated_at?: Date, seller_id?: number) {
        this.id = id;
        this.product_id = product_id;
        this.commission = commission;
        this.publish = publish;
        this.created_id = created_id;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.seller_id = seller_id;
    }
}