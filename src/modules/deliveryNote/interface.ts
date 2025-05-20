export interface ISearch {
    fromDate: string;
    toDate: string;
    date: string;
    page: number;
    limit: number;
    listId?: number[];
    seller_id?: number;
}