export interface ICustomer {
    id?: number;
    code: string;
    name: string;
    phone: string;
    email: string;
    type: string;
    group_id: number;
    address: string;
    publish: boolean;
    tax_code: string;
    created_at?: Date;
    updated_at?: Date;
}