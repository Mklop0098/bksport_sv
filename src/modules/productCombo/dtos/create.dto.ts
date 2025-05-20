import errorMessages from "@core/config/constants";
import { IsNotEmpty, IsOptional, Matches } from "class-validator";

type ComboDetail = {
    product_id: number,
    quantity: number,
    price: number,
    discount_type: number,
    discount_value: number,
    price_combo: number
} 

export class CreateDto {
    id?: number;
    // @Matches(/^.{8}$|^$/, { message: errorMessages.CODE_LENGTH_INPUT })
    // @IsOptional()
    code?: string;
    @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
    name: string;
    image_list?: string;
    publish?: number;
    is_topdeal?: number;
    weight?: number;
    unit?: string;
    brand_id?: number;
    product_type_id?: number;
    category_id?: number;
    description?: string;
    is_sell?: number;
    created_id?: number;
    supplier_id?: number;
    seller_id?: number;
    unit_id?: number;
    content?: string;
    detail_info?: string;
    highlights?: string;
    title?: string;
    meta_description?: string;
    notify?: string;
    is_authentic?: boolean;
    is_freeship?: boolean;
    can_return?: boolean;
    weight_id?: number
   
    // thông tin bảo hành
    warranty_period?: number;
    warranty_place?: string;
    warranty_form?: string;
    warranty_instructions?: string;
    // thông tin thuế
    tax_apply?: boolean; 
    tax_vat_in?: number;
    tax_vat_out?: number;
    tax_product_apply?: number;
    // ton kho
    max_inventory?: number;
    min_inventory?: number;
    // check lại sau

    product_management_type?: string;
    tags?: string;
    product_version_name?: string;
    weight_unit?: string;
    expiry_warning_days?: number;
    warranty_applicable?: number;
    warranty_policy?: string;
    tax_applicable?: number;
    tax_inclusive_price?: number;
    input_tax_percentage?: number;
    output_tax_percentage?: number;
    initial_stock_lc_cn?: number;
    initial_cost_price_lc_cn1?: number;
    minimum_stock_lc_cn1?: number;
    maximum_stock_lc_cn1?: number;
    storage_point?: string;
    avatar?: string;
    product_type_name?: string;
    brand_name?: string
    commission?: number;

    // gia von
    prime_cost?: number;
    prefix_quantity?: number;
    
    publish_yomart?: number

    // xuat su
    brand_origin?:string
    made_in?: string

    // slug
    slug?: string

    type?: string

    combo_details?: ComboDetail[]

    price?: number

    discount_type?: number

    discount_value?: number

    price_combo?: number

    constructor(
        id: number, 
        slug: string,
        name: string, 
        code?: string, 
        image_list?: string, 
        publish?: number, 
        is_topdeal?: number,
        weight?: number, 
        unit?: string, 
        brand_id?: number, 
        product_type_id?: number, 
        category_id?: number,
        description?: string, 
        is_sell?: number, 
        created_id?: number, 
        content?: string, 
        detail_info?: string, 
        highlights?: string, 
        title?: string, 
        meta_description?: string, 
        notify?: string,
        is_authentic?: boolean,
        is_freeship?: boolean,
        can_return?: boolean,
        // thông tin thuế
        tax_apply?: boolean,
        tax_vat_in?: number,
        tax_vat_out?: number,
        tax_product_apply?: number,
        // thông tin bảo hành
        warranty_period?: number,
        warranty_place?: string,
        warranty_form?: string,
        warranty_instructions?: string,
        // ton kho
        max_inventory?: number,
        min_inventory?: number,
        product_management_type?: string, 
        weight_unit?: string, 
        expiry_warning_days?: number, 
        warranty_applicable?: number, 
        warranty_policy?: string, 
        tax_applicable?: number, 
        tax_inclusive_price?: number, 
        input_tax_percentage?: number, 
        output_tax_percentage?: number, 
        initial_stock_lc_cn?: number, 
        initial_cost_price_lc_cn1?: number, 
        minimum_stock_lc_cn1?: number, 
        maximum_stock_lc_cn1?: number, 
        storage_point?: string, 
        avatar?: string, 
        product_type_name?: string, 
        brand_name?: string, 
        unit_id?: number, 
        commission?: number, 
        supplier_id?: number, 
        seller_id?: number,
        prime_cost?: number,
        prefix_quantity?: number,
        
        weight_id?: number,
        publish_yomart?: number, 

        // xuat su
        brand_origin?: string,
        made_in?: string,
        type?: string,
        combo_details?: ComboDetail[],
        price?: number,
        discount_type?: number,
        discount_value?: number,
        price_combo?: number
    ) 
    {
        this.slug = slug,
        this.brand_origin = brand_origin,
        this.made_in = made_in,
        this.id = id;
        this.name = name;
        this.code = code;
        this.image_list = image_list;
        this.publish = publish;
        this.is_topdeal = is_topdeal;
        this.weight = weight;
        this.unit = unit;
        this.brand_id = brand_id;
        this.product_type_id = product_type_id;
        this.category_id = category_id;
        this.description = description;
        this.is_sell = is_sell;
        this.created_id = created_id;
        this.content = content;
        this.detail_info = detail_info;
        this.highlights = highlights;
        this.title = title;
        this.meta_description = meta_description;
        this.notify= notify;
        this.is_authentic= is_authentic;
        this.is_freeship= is_freeship;
        this.can_return= can_return;
        this.warranty_period = warranty_period;
        this.warranty_place = warranty_place;
        this.warranty_form = warranty_form;
        this.warranty_instructions = warranty_instructions,
        this.product_management_type = product_management_type;
        this.weight_unit = weight_unit;
        this.expiry_warning_days = expiry_warning_days;
        this.warranty_applicable = warranty_applicable;
        this.warranty_policy = warranty_policy;
        this.tax_applicable = tax_applicable;
        this.tax_inclusive_price = tax_inclusive_price;
        this.input_tax_percentage = input_tax_percentage;
        this.output_tax_percentage = output_tax_percentage;
        this.initial_stock_lc_cn = initial_stock_lc_cn;
        this.initial_cost_price_lc_cn1 = initial_cost_price_lc_cn1;
        this.minimum_stock_lc_cn1 = minimum_stock_lc_cn1;
        this.maximum_stock_lc_cn1 = maximum_stock_lc_cn1;
        this.storage_point = storage_point;
        this.avatar = avatar;
        this.product_type_name = product_type_name;
        this.brand_name = brand_name
        this.unit_id = unit_id;
        this.commission = commission;
        this.supplier_id = supplier_id;
        this.seller_id = seller_id;
        this.tax_apply = tax_apply
        this.tax_vat_in = tax_vat_in
        this.tax_vat_out = tax_vat_out
        this.tax_product_apply = tax_product_apply
        this.prime_cost = prime_cost
        this.prefix_quantity = prefix_quantity
        this.max_inventory = max_inventory
        this.max_inventory = min_inventory,
        this.weight_id = weight_id
        this.publish_yomart = publish_yomart
        this.type = type
        this.combo_details = combo_details
        this.price = price
        this.discount_type = discount_type
        this.discount_value = discount_value
        this.price_combo = price_combo
    }
}

