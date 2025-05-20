import { CreateDto as PurchaseOrderDetail } from "@modules/orderDetail";
import { IsNotEmpty, Matches } from "class-validator";
import errorMessages from "@core/config/constants";
import { CreateDto as OrderStatusPaymentHistoryModel } from "@modules/purchaseStatusPaymentHistory";
import { CreateDto as OrderStatusHistoryModel } from "@modules/purchaseStatusHistory";
export class CreateDto {
    id?: number;
    code?: string;
    @IsNotEmpty({ message: errorMessages.SUPPLIER_NOT_EXISTED })
    supplier_id?: number;
    publish?: number;
    created_id?: number;

    order_details?: PurchaseOrderDetail[]
    pay_method?: number
    ship_method?: number

    created_at?: Date
    processing_at?: Date
    delivering_at?: Date
    completed_at?: Date
    canceled_at?: Date
    updated_at?: Date

    delivery_date?: string
    customer_phone?: string
    status?: string | boolean;
    note?: string
    status_payment?: string
    discount_value?: number
    discount_type?: number
    branch_id?: number
    imported_at?: Date
    order_status_payment_history?: OrderStatusPaymentHistoryModel[]
    order_status_history?: OrderStatusHistoryModel[]
    seller_id?: number
    payment_method?: string
    payment_date?: Date;
    type?: string
    price?: number

    constructor(id: number, code?: string, supplier_id?: number, publish?: number, created_id?: number, order_details?: PurchaseOrderDetail[], pay_method?: number, ship_method?: number, customer_address?: string, city_id?: number, city_name?: string, district_id?: number, district_name?: string, ward_id?: number, ward_name?: string, created_at?: Date, processing_at?: Date, delivering_at?: Date, completed_at?: Date, canceled_at?: Date, updated_at?: Date, delivery_date?: string, customer_phone?: string, name?: string, phone?: string, address?: string, status?: string, note?: string, status_payment?: string, email?: string, discount_value?: number, discount_type?: number, branch_id?: number, imported_at?: Date, type?: string, price?: number) {
        this.id = id;
        this.publish = publish;
        this.created_id = created_id
        this.code = code
        this.supplier_id = supplier_id
        this.order_details = order_details
        this.pay_method = pay_method
        this.ship_method = ship_method;
        this.created_at = created_at
        this.processing_at = processing_at
        this.delivering_at = delivering_at
        this.completed_at = completed_at
        this.canceled_at = canceled_at
        this.updated_at = updated_at;
        this.delivery_date = delivery_date;
        this.customer_phone = customer_phone;
        this.status = status;
        this.note = note;
        this.status_payment = status_payment;
        this.discount_value = discount_value;
        this.discount_type = discount_type;
        this.branch_id = branch_id;
        this.imported_at = imported_at
        this.type = type
        this.price = price
    }
}
