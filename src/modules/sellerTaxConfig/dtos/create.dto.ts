export class CreateDto {
    seller_id?: number;
    tax_vat_in: number;
    tax_vat_out: number;
    tax_tncn: number;
    affiliate_tax_vat: number;
    affiliate_tax_tncn: number;
    tax_seller_apply?: number;


    constructor(seller_id: number, tax_vat_in: number, tax_vat_out: number, tax_tncn: number, affiliate_tax_vat: number, affiliate_tax_tncn: number, tax_seller_apply: number) {
        this.seller_id = seller_id;
        this.tax_vat_in = tax_vat_in;
        this.tax_vat_out = tax_vat_out;
        this.tax_tncn = tax_tncn;
        this.affiliate_tax_vat = affiliate_tax_vat;
        this.affiliate_tax_tncn = affiliate_tax_tncn;
        this.tax_seller_apply = tax_seller_apply;
    }
}