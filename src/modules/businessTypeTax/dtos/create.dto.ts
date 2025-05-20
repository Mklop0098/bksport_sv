export class Create {
    business_type_id: number;
    tax_vat: number;
    tax_tncn: number;
    object_type: string;


    constructor(business_type_id: number, tax_vat: number, tax_tncn: number, object_type: string) {
        this.business_type_id = business_type_id;
        this.tax_vat = tax_vat;
        this.tax_tncn = tax_tncn;
        this.object_type = object_type;
    }
}