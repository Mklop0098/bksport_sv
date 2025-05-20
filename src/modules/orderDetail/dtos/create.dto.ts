export class CreateDto {
    id?: number;
    order_id?: number;
    product_id?: number;
    quantity?: number;
    price?: number;
    price_import?: number;
    publish?: number;
    created_id?: number;
    price_wholesale?: number | null;
    discount_value?: number;
    discount_type?: number;
    price_type?: number;
    seller_id?: number;
    branch_id?: number;
    type?: string;
    combo_id?: number

    constructor(id: number, order_id: number, product_id: number, quantity: number, price: number, publish: number, created_id: number, price_wholesale: number, discount_value: number, discount_type: number, price_type: number, price_import?: number, branch_id?: number, type?: string, combo_id?: number) {
        this.id = id;
        this.order_id = order_id;
        this.product_id = product_id;
        this.quantity = quantity;
        this.price = price;
        this.publish = publish;
        this.created_id = created_id;
        this.price_wholesale = price_wholesale;
        this.discount_value = discount_value;
        this.discount_type = discount_type;
        this.price_type = price_type;   
        this.price_import = price_import
        this.branch_id = branch_id;
        this.type = type;
        this.combo_id = combo_id;
    }
}