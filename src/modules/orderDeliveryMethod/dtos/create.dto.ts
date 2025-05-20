
export class CreateDto {
    id?: number;
    order_id?: number;
    method?: string;
    shipper_id?: number;
    ship_key?: string
    ship_fee?: number;
    ship_fee_payer?: string;

    constructor(id: number, order_id: number, method: string, shipper_id: number, ship_key: string, ship_fee: number, ship_fee_payer: string ) {
        this.id = id;
        this.order_id = order_id;
        this.method = method;
        this.shipper_id = shipper_id;
        this.ship_key = ship_key;
        this.ship_fee = ship_fee;
        this.ship_fee_payer = ship_fee_payer;
    }
}
