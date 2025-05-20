export class CreateDto {
    id?: number;
    order_id?: number;
    user_id?: number;
    status?: string;
    created_at?: Date;
    seller_id?: number;
    branch_id?: number;
    reason?: string;
    constructor(id: number, order_id: number, status: string, created_at: Date, user_id: number, payment_method: string, branch_id: number, reason: string) {
        this.id = id;
        this.order_id = order_id;
        this.status = status;
        this.created_at = created_at;
        this.user_id = user_id;
        this.branch_id = branch_id;
        this.reason = reason;
    }
}