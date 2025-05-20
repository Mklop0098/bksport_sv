export interface ISupplier {
    id?: number;
    name: string;
    phone: string;
    email: string;
    group_id: number;
    address: string;
    publish: boolean;
    created_at?: Date;
    updated_at?: Date;
}