export class CreateDto {
    tax_vat_in?: number
    tax_vat_out?: number
    tax_product_apply?: number

    constructor(tax_vat_in?: number, tax_vat_out?: number, tax_product_apply?: number) {
        this.tax_vat_in = tax_vat_in;
        this.tax_vat_out = tax_vat_out;
        this.tax_product_apply = tax_product_apply;
    }
}