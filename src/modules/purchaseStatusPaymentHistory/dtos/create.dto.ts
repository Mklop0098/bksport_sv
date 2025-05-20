export class CreateDto {
    id?: number;
    order_id?: number;
    user_id?: number;
    status?: string;
    amount_paid?: number;
    payment_method?: string;
    seller_id?: number;
    created_at?: Date;
    payment_date?: Date;

    constructor(id: number, order_id: number, status: string, created_at: Date, user_id: number) {
        this.id = id;
        this.order_id = order_id;
        this.status = status;
        this.created_at = created_at;
        this.user_id = user_id;
    }
}