import { IsNotEmpty, IsString } from "class-validator";

export class CreateDto {
    id?: number
    @IsNotEmpty()
    name?: string
    publish?: number
    home?: number
    top?: number
    hot?: number
    is_topone?: number
    sort?: number
    slug?: string
    title?: string
    meta_description?: string
    content?: string
    parent_id?: number
    image?: string
    type?: number

    constructor(
        id: number,
        name: string,
        publish: number,
        home: number,
        top: number,
        hot: number,
        is_topone: number,
        sort: number,
        slug: string,
        title: string,
        meta_description: string,
        content: string,
        parent_id: number,
        image: string,
        type: number,
    ) {
        this.id = id,
        this.name = name,
        this.publish = publish,
        this.home = home,
        this.top = top,
        this.hot = hot,
        this.is_topone = is_topone,
        this.sort = sort,
        this.slug = slug,
        this.title = title,
        this.meta_description = meta_description,
        this.content = content,
        this.parent_id = parent_id,
        this.image = image,
        this.type = type
    }
}