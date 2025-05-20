export class CreateDto {
    id?: number;
    order_id?: number;
    product_id?: number;
    quantity?: number;
    price?: number;
    publish?: number;
    created_id?: number;
    discount_value?: number;
    discount_type?: number;
    seller_id?: number;
    branch_id?: number

    constructor(id: number, order_id: number, product_id: number, quantity: number, price: number, publish: number, created_id: number, discount_value: number, discount_type: number, branch_id: number) {
        this.id = id;
        this.order_id = order_id;
        this.product_id = product_id;
        this.quantity = quantity;
        this.price = price;
        this.publish = publish;
        this.created_id = created_id;
        this.discount_value = discount_value;
        this.discount_type = discount_type;
        this.branch_id = branch_id
    }
}