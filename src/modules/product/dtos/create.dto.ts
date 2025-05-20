import errorMessages from "@core/config/constants";
import { IsNotEmpty, IsOptional, Matches } from "class-validator";

type AttributeType = {
    name: string,
    values: string[]
}

type SubProductAttribute = {
    product_attributes_id: number,
    attribute_detail_value: string,
    product_attribute_detail_id: number
} 

export class CreateDto {
    id?: number;
    // @Matches(/^.{8}$|^$/, { message: errorMessages.CODE_LENGTH_INPUT })
    // @IsOptional()
    parent_name?: string
    code?: string;
    @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
    name: string;
    image_list?: string;
    publish?: number;
    is_topdeal?: number;
    @Matches(/^[0-9]+(\.[0-9]+)?$/, { message: 'Khối lượng phải là số và không được âm' })
    weight?: number;
    unit?: string;
    @IsNotEmpty({ message: 'Giá bán không được để trống' })
    @Matches(/^[0-9]+(\.[0-9]+)?$/, { message: 'Giá bán phải là số và không được âm' })
    price?: number;
    @IsNotEmpty({ message: 'Giá bán không được để trống' })
    @Matches(/^[0-9]+(\.[0-9]+)?$/, { message: 'Giá bán phải là số và không được âm' })
    price_import?: number;
    @IsNotEmpty({ message: 'Giá bán không được để trống' })
    @Matches(/^[0-9]+(\.[0-9]+)?$/, { message: 'Giá bán phải là số và không được âm' })
    price_wholesale?: number;
    price_sale?: number;
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
    // attribute 
    parent_id?: number;
    attributes?: AttributeType[];
    product_attribute?: string;
    sub_products?: any[]
    sub_product_attributes?: SubProductAttribute[]

    attributes_json?: string
    sub_products_json?: string 
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
    attribute_1?: string;
    attribute_1_value?: string;
    attribute_2?: string;
    attribute_2_value?: string;
    attribute_3?: string;
    attribute_3_value?: string;
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

    constructor(
        id: number, 
        slug: string,
        name: string, 
        code?: string, 
        parent_name?: string,
        image_list?: string, 
        publish?: number, 
        is_topdeal?: number,
        weight?: number, 
        unit?: string, 
        price?: number, 
        price_wholesale?: number, 
        price_sale?: number,
        price_import?: number, 
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
        tags?: string, 
        attribute_1?: string, 
        attribute_1_value?: string, 
        attribute_2?: string, 
        attribute_2_value?: string, 
        attribute_3?: string, 
        attribute_3_value?: string, 
        product_version_name?: string, 
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
        parent_id?: number,
        attributes?: AttributeType[],
        sub_product_attributes?: SubProductAttribute[],
        sub_products?: any[],
        product_attribute?: string,
        attributes_json?: string,
        sub_products_json?: string,
        publish_yomart?: number, 

        // xuat su
        brand_origin?: string,
        made_in?: string,
        type?: string
    ) 
    {
        this.slug = slug,
        this.brand_origin = brand_origin,
        this.made_in = made_in,
        this.id = id;
        this.name = name;
        this.code = code;
        this.parent_name = parent_name;
        this.image_list = image_list;
        this.publish = publish;
        this.is_topdeal = is_topdeal;
        this.weight = weight;
        this.unit = unit;
        this.price = price;
        this.price_wholesale = price_wholesale;
        this.price_sale = price_sale;
        this.price_import = price_import;
        this.brand_id = brand_id;
        this.product_type_id = product_type_id;
        this.category_id = category_id;
        this.description = description;
        this.is_sell = is_sell;
        this.price_import = price_import;
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
        this.tags = tags;
        this.attribute_1 = attribute_1;
        this.attribute_1_value = attribute_1_value;
        this.attribute_2 = attribute_2;
        this.attribute_2_value = attribute_2_value;
        this.attribute_3 = attribute_3;
        this.attribute_3_value = attribute_3_value;
        this.product_version_name = product_version_name;
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
        this.max_inventory = min_inventory
        this.parent_id = parent_id;
        this.attributes = attributes;
        this.sub_products = sub_products
        this.product_attribute = product_attribute
        this.weight_id = weight_id
        this.attributes_json = attributes_json,
        this.sub_products_json = sub_products_json 
        this.sub_product_attributes = sub_product_attributes
        this.publish_yomart = publish_yomart
        this.type = type
    }
}