import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number

    @IsNotEmpty()
    @IsString()
    name?: string
    des?: string
    icon_svg?: string

    @IsNotEmpty()
    parentid?: number
    need_id?: number

    @IsNotEmpty()
    public?: number
    home?: number
    home_mobile?: number
    left?: number
    right?: number
    hot?: number
    footer?: number
    main?: number

    @IsNotEmpty()
    type?: number

    @IsNotEmpty()
    sort?: number
    link?: string
    image?: string
    thumb?: string
    webps?: string
    webps_thumb?: string
    banner?: string
    banner_thumb?: string
    month?: string
    year?: string
    title?: string
    meta_descriptions?: string
    meta_keyword?: string
    content?: string
    content_bottom?: string
    @IsNotEmpty()
    is_policy?: number

    constructor() {
      
    }
}