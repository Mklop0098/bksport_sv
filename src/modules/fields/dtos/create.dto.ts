import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    name?: string
    code?: string
    sport_id?: number
    seller_id?: number
    city_id?: number
    district_id?: number
    ward_id?: number
    address?: string
    price?: number
    price_sale?: number
    width?: number
    length?: number
    can_order?: number
    publish_yomart?: number
    publish?: number
    description?: string
    content?: string
    detail_info?: string
    highlights?: string
    title?: string
    meta_description?: string
    slug?: string
    created_id?: number
    is_topdeal?: number
    notify?: number
    attributes?: string
    constructor(id: number, name: string, code: string, sport_id: number, seller_id: number, city_id: number, district_id: number, ward_id: number, address: string, price: number, price_sale: number, width: number, length: number, can_order: number, publish_yomart: number, publish: number, description: string, content: string, detail_info: string, highlights: string, title: string, meta_description: string, slug: string, created_id: number, is_topdeal: number, notify: number, attributes: string) {
        this.id = id,
        this.name = name,
        this.code = code,
        this.sport_id = sport_id,
        this.seller_id = seller_id,
        this.city_id = city_id,
        this.district_id = district_id,
        this.ward_id = ward_id,
        this.address = address,
        this.price = price,
        this.price_sale = price_sale,
        this.width = width,
        this.length = length,
        this.can_order = can_order,
        this.publish_yomart = publish_yomart,
        this.publish = publish,
        this.description = description,
        this.content = content,
        this.detail_info = detail_info,
        this.highlights = highlights,
        this.title = title,
        this.meta_description = meta_description,
        this.slug = slug,
        this.created_id = created_id,
        this.is_topdeal = is_topdeal,
        this.notify = notify,
        this.attributes = attributes
    }
}