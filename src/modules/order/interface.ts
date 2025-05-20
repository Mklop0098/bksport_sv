export interface ICustomerOrder {
    name?: string,
    phone?: string,
    email?: string,
    address?: string,
    city_id?: number,
    city_name?: string,
    district_id?: number,
    district_name?: string,
    ward_id?: number,
    ward_name?: string,
}

export interface ICalculateOrder {
    price?: number,
    price_wholesale?: number,
    quantity?: number,
    discount_value?: number,
    discount_type?: number,
    totalPrice?: number,
    totalDiscount?: number,
    price_type?: number,
}


export interface IReportStatus {
    status?: number,
    total_orders?: number,
}

export interface IReportRevenue {
    column?: string,
    totalDiscount?: number,
    totalAfterDiscount?: number,
    total?: number,
    type?: string,
}

export interface IReportRevenueOrder {
    date: string;
    order_detail: Array<{ totalPrice: number; totalDiscount: number; totalPriceAfterDiscount: number; }>;
}

export interface IRevenueOrder {
    id: number;
    created_at: string;
    totalPrice: number;
    totalDiscount: number;
    totalPriceAfterDiscount: number;
    order_detail: any[];
}


export interface IReportRevenue {
    column?: string,
    amount?: number,
}