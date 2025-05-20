import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { RowDataPacket } from "mysql2";
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { WarrantyDto } from "@modules/warranty";
import { CreateDto as ProductCommission } from "@modules/productCommission";
import { CreateDto as ProductTax } from "@modules/productTaxConfig";
import { CreateDto as ProductImage } from "@modules/productImage";
import { CreateDto } from "./dtos/create.dto";
import { checkExist } from "@core/utils/checkExist";
import { generateCodeWithSeller } from "@core/utils/gennerate.code";
import { convertStringToSlug } from "@core/utils/convertStringToSlug";
import WarrantyService from "@modules/warranty/service";
import ProductIamgeService from "@modules/productImage/service";
import ProductComboDetailService from "@modules/productComboDetail/service";
import ProductCommissionService from "@modules/productCommission/service";
import ProductTaxConfigService from "@modules/productTaxConfig/service";
import { IPagiantion } from "@core/interfaces";
import { addCollate } from "@core/utils/addCollate";
import Ilog from "@core/interfaces/log.interface";


class ProductComboService {

    private tableName = 'product'

    private productImageService = new ProductIamgeService()
    private productComboDetailService = new ProductComboDetailService()
    private productCommissionService = new ProductCommissionService()
    private productTaxService = new ProductTaxConfigService()
    private warrantyService = new WarrantyService()

    private createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    public uploadImage = async (code: string, file: Express.Multer.File, type: string, is_save?: boolean) => {
        const userDir = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string, code);
        const thumbailDir = path.join(userDir, 'thumbnail');

        let fileExtension: string;
        switch (file.mimetype) {
            case 'image/jpeg':
                fileExtension = '.jpeg';
                break;
            case 'image/jpg':
                fileExtension = '.jpg';
                break;
            case 'image/png':
                fileExtension = '.png';
                break;
            default:
                return new HttpException(400, errorMessages.INVALID_FILE);
        }
        if (!is_save) {
            return `${type}${fileExtension}`
        }
        this.createFolderIfNotExist(userDir)
        this.createFolderIfNotExist(thumbailDir)

        const uploadPath = path.join(userDir, `${type}${fileExtension}`)

        //check 
        const metadata = await sharp(file.buffer)
            .rotate().metadata();
        const upload = await sharp(file.buffer).toFile(uploadPath)
        if (upload) {
            await sharp(file.buffer)
                .withMetadata()
                .rotate()
                .toFile(uploadPath);
            await sharp(file.buffer).
                resize(350, 350)
                .rotate()
                .toFile(path.join(thumbailDir, `${type}${fileExtension}`));
            return `${type}${fileExtension}`
        }
        return new HttpException(400, errorMessages.UPLOAD_FAILED);
    }
    private removeVietnameseAccents = (str: string) => {
        const vietnameseAccents = 'àáạảãâấầẩẫậăắằẳẵặèéẹẻẽêếềểễệìíịỉĩòóọỏõôốồổỗộơớờởỡợùúụủũưứừửữựỳýỵỷỹđ';
        const replacement = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeiiiiiiooooooooooooouuuuuuuuuuuyyyyyd';
        return str
            .split('')
            .map(char => {
                const index = vietnameseAccents.indexOf(char);
                return index !== -1 ? replacement[index] : char;
            })
            .join('')
    }
    private convertToImageName = (name: string, listImage: any, num?: number) => {
        const nameImage = this.removeVietnameseAccents(name)
            .replace(/\s+/g, '_')
            .toLowerCase();
        const imageNames = listImage.map((file: string, index: number) => {
            const currentNum = num ? num + index + 1 : index + 1
            return `${nameImage}_${currentNum}`
        })
        return imageNames
    }
    private awaitUploadImage = async (code: string, listImage: any, imageNames: string[], is_save = true) => {
        const awaitUploadImage = listImage.map(async (file: any, index: number) => {
            const upload = await this.uploadImage(code, file, imageNames[index] as string, is_save);
            return upload
        })
        return await Promise.all(awaitUploadImage)
    }
    private rePathOfImage = (listImage: string[], code: string, type?: string) => {
        let userDir = ''
        if (type === 'thumbnail') {
            userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code, 'thumbnail');
        }
        else {
            userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code);
        }
        const rePath = listImage.map((image: string) => {
            const uploadPath = path.join(userDir, image)
            return uploadPath
        })
        return rePath
    }


    public createComboProduct = async (model: CreateDto, listImageFiles: any) => {
        const listImage = listImageFiles ? listImageFiles.files : []
        let sellerCodeQuery = `SELECT code from seller WHERE id = ?`
        const sellerCode = await database.executeQuery(sellerCodeQuery, [model.seller_id]) as RowDataPacket

        model.unit_id = (model.unit_id as any * 1)
        let code: string;
        if (listImage !== undefined && listImage.length > 10)
            return new HttpException(400, errorMessages.INVALID_FILE_QUANTITY, 'files');
        let imageNames;
        if (Array.isArray(listImage) && listImage.length > 0) {
            const maxFileSize = process.env.PRODUCT_UPLOAD_IMAGE_SIZE! as any as number;
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
            const isAllowedMimeType = listImage.every((file: any) => allowedMimeTypes.includes(file.mimetype));
            if (!isAllowedMimeType)
                return new HttpException(400, errorMessages.INVALID_FILE)
            if (listImage.some((file: any) => file.size > maxFileSize))
                return new HttpException(400, errorMessages.INVALID_FILE_SIZE)
            else imageNames = this.convertToImageName(model.name, listImage)
        }

        if (model.code && model.code.length > 0) {
            code = model.code
            if (code && await checkExist(this.tableName, 'code', sellerCode[0].code + code))
                return new HttpException(400, errorMessages.CODE_EXISTED, 'code');
        } else code = await generateCodeWithSeller(this.tableName, 'CB', 8, model.seller_id as number) as string;

        // set title
        if (!model.title || model.title == '') {
            model.title = model.name;
        }
        // create slug from name
        let slug = '';
        if (model.name && model.name != '') {
            slug = convertStringToSlug(model.name);
        }
        const create_at = new Date()
        const update_at = new Date()
        let query = ` insert into ${this.tableName} (
            code, 
            name, 
            publish, 
            is_topdeal, 
            weight, 
            unit_id, 
            brand_id, 
            product_type_id, 
            description , 
            is_sell, 
            created_id, 
            created_at, 
            updated_at, 
            supplier_id, 
            seller_id, 
            content, 
            detail_info, 
            highlights, 
            title, 
            meta_description, 
            slug, 
            category_id, 
            tax_apply, 
            notify, 
            is_authentic, 
            is_freeship,
            can_return, 
            max_inventory,
            min_inventory, 
            weight_id, 
            publish_yomart, 
            brand_origin, 
            made_in, 
            type,
            price
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`
        let values = [
            code,
            model.name,
            model.publish ?? 1,
            model.is_topdeal ?? 1,
            model.weight || null,
            model.unit_id || null,
            model.brand_id || null,
            model.product_type_id || null,
            model.description || null,
            (model.is_sell != undefined) ? model.is_sell : 1,
            model.created_id || null,
            create_at || null,
            update_at,
            model.supplier_id || 0,
            model.seller_id || 0,
            model.content || '',
            model.detail_info || '[]',
            model.highlights || '[]',
            model.title || model.name,
            model.meta_description || '',
            slug,
            model.category_id || null,
            model.tax_apply || 0,
            model.notify || null,
            model.is_authentic || 0,
            model.is_freeship || 0,
            model.can_return || 0,
            model.max_inventory || null,
            model.min_inventory || null,
            model.weight_id || 1,
            model.publish_yomart || 0,
            model.brand_origin || null,
            model.made_in || null,
            model.type || 'combo',
            model.price || 0
        ]

        let log: Ilog = {
            user_id: model.created_id!,
            action: 'create',
            module_id: 5,
            des: 'đã tạo combo',
        }
        console.log('log', log)
        const result = await database.executeQueryHistory(query, values, log) as any;

        if (result.affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED);

        let productId = (result as RowDataPacket).insertId
        // upload and save img list
        let resultImage: any[] = []
        if (Array.isArray(listImage) && listImage.length > 0) {
            const listPath: string[] = await Promise.all(await this.awaitUploadImage(code, listImage, imageNames))
            for (let i = 0; i < listPath.length; i++) {
                console.log(listPath[i])
                let modelProductImage: ProductImage = {
                    product_id: productId,
                    image: listPath[i],
                    created_id: model.created_id,
                    publish: model.publish ?? 1
                }
                await this.productImageService.create(modelProductImage).then((result) => {
                    const path = this.rePathOfImage([listPath[i]], code)
                    const pathThumbnail = this.rePathOfImage([listPath[i]], code, 'thumbnail');
                    (result as RowDataPacket).data.image = path[0];
                    (result as RowDataPacket).data.image_thumbnail = pathThumbnail[0];
                    resultImage.push((result as any).data)
                })
            }
        }
        if (model.combo_details && model.combo_details.length > 0) {
            for (const element of model.combo_details) {
                const comboDetail = {
                    combo_id: productId,
                    product_id: element.product_id,
                    quantity: element.quantity,
                    price: element.price,
                    discount_type: element.discount_type,
                    discount_value: element.discount_value,
                    price_combo: element.price_combo
                }
                await this.productComboDetailService.create(comboDetail)
            }
        }
        // chiết khấu tiếp thị
        if (model.commission != undefined) {
            try {
                const commssion: ProductCommission = {
                    product_id: productId,
                    commission: model.commission,
                    created_id: model.created_id,
                    seller_id: model.seller_id
                }
                const resultCommission = await this.productCommissionService.create(commssion);
                ////console.log('resultCommission', resultCommission);

            } catch (error) {
                return new HttpException(500, errorMessages.CREATE_FAILED);
            }
        }
        // lưu thông tin thuế
        if (!!(model.tax_apply)) {
            try {
                const productTaxDataInsert: ProductTax = {
                    tax_vat_in: model.tax_vat_in,
                    tax_vat_out: model.tax_vat_out,
                    tax_product_apply: model.tax_product_apply
                }
                await this.productTaxService.updateByProductId(productTaxDataInsert, productId)
            } catch (error) {
                return new HttpException(500, errorMessages.CREATE_FAILED);
            }
        }
        // lưu thông tin bảo hành
        if ((model.warranty_period) || (model.warranty_place && model.warranty_place != '') || (model.warranty_form && model.warranty_form != '')) {
            try {
                const warrantyDataInsert: WarrantyDto = {
                    warranty_period: model.warranty_period || 0,
                    warranty_place: model.warranty_place,
                    warranty_form: model.warranty_form,
                    warranty_instructions: model.warranty_instructions,
                    product_id: productId,
                    seller_id: model.seller_id,
                    created_id: model.created_id
                }
                await this.warrantyService.create(warrantyDataInsert);

            } catch (error) {
                return new HttpException(500, errorMessages.CREATE_FAILED);
            }
        }
        // convert string to object detail_info field
        if (model.detail_info && model.detail_info != '') {
            model.detail_info = JSON.parse(model.detail_info);
        }
        // convert string to object highlights field
        if (model.highlights && model.highlights != '') {
            model.highlights = JSON.parse(model.highlights);
        }
        // tao don nhap kho
        return {
            data: {
                id: (result as any).insertId,
                code,
                ...model,
                images: resultImage,
                created_at: create_at,
                updated_at: update_at
            }
        }
    }

    public findComboById = async (id: number) => {
        let query = `
        select pc.commission, 
        pc.commission,
        p.id,
        p.code,
        p.name,
        p.publish,
        p.is_topdeal,
        p.weight,
        p.unit_id,
        p.brand_id,
        p.product_type_id,
        p.description,
        p.is_sell,
        p.created_id,
        p.created_at,
        p.updated_at,
        p.supplier_id,
        p.seller_id,
        p.content,
        p.detail_info,
        p.highlights,
        p.title,
        p.meta_description,
        p.slug,
        p.category_id,
        p.tax_apply,
        p.notify,
        p.is_authentic,
        p.is_freeship,
        p.can_return,
        p.weight_id,
        p.publish_yomart,
        p.brand_origin,
        p.made_in,
        p.price as combo_price,
        CONCAT(IFNULL((SELECT count(id) FROM product_combo_detail WHERE combo_id = p.id), 0), ' sản phẩm') as combo_detail_count,
        ptx.tax_vat_in, ptx.tax_vat_out, ptx.tax_product_apply, c.id as category_id, c.name as category_name, pt.id as product_type_id, pt.name as product_type_name, b.id as brand_id, b.name as brand_name, pu.name as unit_name , group_concat(pi.image) as images, pc.commission as commission, w.warranty_period, w.warranty_place, w.warranty_form, w.warranty_instructions,
        IFNULL((
            select sum(od.quantity) as sum from orders o 
            LEFT JOIN order_detail od on o.id = od.order_id
            WHERE (o.status <= 3 or o.status = 7) and od.product_id = war.product_id and od.seller_id = war.seller_id), 0) as available,
        sum(war.quantity) as inventory,
        GROUP_CONCAT(
            DISTINCT 
            CASE 
                WHEN pi.image IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', pi.id,
                        'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/', pi.image),
                        'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/thumbnail/', pi.image)
                    )
                ELSE NULL 
            END
        ) AS images,
        wu.name as weight_name,
        GROUP_CONCAT(
            DISTINCT 
            JSON_OBJECT(
                'id', pcd.id,
                'code', (select code from product where id = pcd.product_id),
                'product_id', pcd.product_id,
                'quantity', pcd.quantity,
                'price', pcd.price,
                'total_price', pcd.price_combo * pcd.quantity,
                'name', (select name from product where id = pcd.product_id),
                'image', IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = (select parent_id from product where id = pcd.product_id)), (select code from product where id = pcd.product_id)), '/', pi.image) from product_image pi where product_id = pcd.product_id limit 1), null),
                'discount_type', pcd.discount_type,
                'discount_value', pcd.discount_value,
                'price_combo', pcd.price_combo
            )
        ) AS combo_details
        from product p 
        left join warehouse war on war.product_id = p.id
        left join product_type pt on p.product_type_id = pt.id 
        left join brand b on p.brand_id = b.id 
        left join product_image pi on pi.product_id = p.id  
        left join product_unit pu on p.unit_id = pu.id 
        left join product_commission pc on p.id = pc.product_id 
        left join warranty w on p.id = w.product_id 
        left join product_category c on p.category_id = c.id
        left join product_tax_config ptx on p.id = ptx.product_id
        left join product p1 on p1.parent_id = p.id
        left join product_attributes pa on pa.product_parent_id = p.id
        left join product_attribute_detail pad on pad.attribute_id = pa.id
        left join weight_unit wu on wu.id = p.weight_id
        left join product_combo_detail pcd on p.id = pcd.combo_id
        where (war.branch_id = IFNULL((SELECT id from branch where seller_id = p.seller_id and online_selling = 1), (SELECT min(id) from branch where seller_id = p.seller_id)) OR IFNULL((SELECT id from branch where seller_id = p.seller_id and online_selling = 1), (SELECT min(id) from branch where seller_id = p.seller_id)))
        and p.id = ?
        group by p.id, p.seller_id;
        `;
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED);
        const result = await database.executeQuery(query, [id]) as RowDataPacket;
        //console.log(result)

        if (result.length === 0)
            return new HttpException(404, errorMessages.NOT_EXISTED);
        let resultData = (result as RowDataPacket[])[0];
        if (resultData.detail_info != '') {
            resultData.detail_info = JSON.parse(resultData.detail_info);
        }
        if (resultData.highlights != '') {
            resultData.highlights = JSON.parse(resultData.highlights);
        }
        const history = await database.executeQuery(`
            select ah.des, ah.created_at, ah.reason, u.name as user_name, p.code as product_code 
            from action_history ah 
            left join users u on u.id = ah.user_id 
            left join product p on p.id = ah.reference_id
            where ah.reference_id = ? and ah.module_id = 5
            order by ah.created_at asc
        `, [id]) as RowDataPacket;
        return {
            data: {
                // ...resultData,
                ...result[0],
                images: result[0].images ? JSON.parse('[' + result[0].images + ']') : [],
                unit_id: result[0].unit_id && Number(result[0].unit_id),
                available: Number(result[0].inventory) - Number(result[0].available),
                is_sell_name: this.convertIsSellToIsSellName((result as any)[0].is_sell),
                combo_details: result[0].combo_details ? JSON.parse('[' + result[0].combo_details + ']') : [],
                history: history.map((item: any) => {
                    return {
                        ...item,
                        reason: JSON.parse(item.reason)
                    }
                })
            }
        }
    }

    public convertIsSellToIsSellName = (is_sell: number) => {
        if (is_sell == 1) return errorMessages.ALLOW_SELL;
        return errorMessages.NOT_ALLOW_SELL;
    }

    public searchs = async (key: string, name: string, publish: boolean, code: string, page: number, limit: number, is_sell: number, product_type_name: string, product_type_id: number, brand_id: number, created_id: number, category_id: number, notify: string, is_authentic: boolean, is_freeship: boolean, can_return: boolean, seller_id: number, brand_origin: string, made_in: string, publish_yomart: number) => {
        let query = `
            SELECT 
                p.publish,
                p.publish_yomart,
                p.id,
                p.code,
                p.name,
                p.created_id,
                p.created_at,
                p.type,
                pu.name as unit_name,
                u.name as created_name, 
                wu.name as weight_name,
                p.price as combo_price,
                CONCAT(IFNULL((SELECT count(id) FROM product_combo_detail WHERE combo_id = p.id), 0), ' sản phẩm') as combo_detail_count,
                GROUP_CONCAT(
                    DISTINCT 
                    CASE 
                        WHEN pi.image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'id', pi.id,
                                'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/', pi.image),
                                'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', p.code, '/thumbnail/', pi.image)
                            )
                        ELSE NULL 
                    END
                ) AS images,
                GROUP_CONCAT(
                    DISTINCT 
                    JSON_OBJECT(
                        'id', pcd.id,
                        'code', (select code from product where id = pcd.product_id),
                        'product_id', pcd.product_id,
                        'quantity', pcd.quantity,
                        'price', pcd.price_combo,
                        'total_price', pcd.price_combo * pcd.quantity,
                        'name', (select name from product where id = pcd.product_id),
                        'image', IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = (select parent_id from product where id = pcd.product_id)), (select code from product where id = pcd.product_id)), '/', pi.image) from product_image pi where product_id = pcd.product_id limit 1), null)
                    )
                ) AS combo_details
            FROM ${this.tableName} p
            LEFT JOIN product_combo_detail pcd ON p.id = pcd.combo_id
            LEFT JOIN product_type pt ON p.product_type_id = pt.id 
            LEFT JOIN supplier sp ON p.supplier_id = sp.id
            LEFT JOIN product_category c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_id = u.id
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN branch br ON br.seller_id = p.seller_id
            LEFT JOIN product_image pi ON pi.product_id = p.id
            LEFT JOIN weight_unit wu ON wu.id = p.weight_id
            LEFT JOIN brand b ON p.brand_id = b.id
            LEFT JOIN product_commission pc ON p.id = pc.product_id
            WHERE p.type = 'combo' `
        if (publish != undefined) {
            query += ` AND p.publish = ${publish}`
        }
        if (key != undefined) {
            query += ` AND (p.name LIKE '%${key}%' OR p.code LIKE '%${key}%' )`;
        }
        if (code != undefined) {
            query += ` and p.code like '%${code}%'`
        }
        if (name != undefined) {
            query += ` and p.name like '%${name}%'`
        }
        if (publish != undefined) {
            query += ` and p.publish = ${publish}`
        }
        if (publish_yomart != undefined) {
            query += ` and p.publish_yomart = ${publish_yomart}`
        }
        if (brand_origin != undefined) {
            query += ` and p.brand_origin like '%${brand_origin}%'`
        }
        if (made_in != undefined) {
            query += ` and p.made_in like '%${made_in}%'`
        }
        if (is_sell != undefined) {
            query += ` and p.is_sell = ${is_sell}`
        }
        if (product_type_name != undefined) {
            query += ` and pt.name like '%${product_type_name}%'`
        }
        if (product_type_id != undefined) {
            query += ` and pt.id = ${product_type_id}`
        }
        if (seller_id != undefined) {
            query += ` and p.seller_id = ${seller_id}`
        }
        if (brand_id != undefined) {
            query += ` and p.brand_id = ${brand_id}`
        }
        if (created_id != undefined) {
            query += ` and p.created_id = ${created_id}`
        }
        if (notify != undefined) {
            query += ` and p.notify = ${notify}`
        }
        if (is_authentic != undefined) {
            query += ` and p.is_authentic = ${is_authentic}`
        }
        if (is_freeship != undefined) {
            query += ` and p.is_freeship = ${is_freeship}`
        }
        if (can_return != undefined) {
            query += ` and p.can_return = ${can_return}`
        }
        query += ` and p.parent_id = 0 group by p.id, p.seller_id order by p.id desc`
        const count = await database.executeQuery(query) as RowDataPacket;

        if (page && page < 1 || limit && limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }

        const totalPages = Math.ceil(count.length / limit);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages
        const result = await database.executeQuery(await addCollate(query)) as RowDataPacket;

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result.map((item: any) => { return { ...item, combo_details: item.combo_details ? JSON.parse("[" + item.combo_details + "]") : [], images: item.images ? JSON.parse("[" + item.images + "]") : [] } }),
            pagination: pagination
        }
    }
    public updateCombo = async (model: CreateDto, id: number, listImageFiles: any) => {
        const currentComboDetail = await database.executeQuery(
            `
                select product_id, price_combo, quantity, p.code as product_code 
                from product_combo_detail 
                left join product p on p.id = product_combo_detail.product_id
                where combo_id = ${id}
            `
        ) as RowDataPacket[]
        if (currentComboDetail.length === 0)
            return new HttpException(404, errorMessages.NOT_EXISTED)
        const reason = []
        if (model.combo_details && model.combo_details.length > 0) {
            let comboDetails = model.combo_details
            for (let i = 0; i < comboDetails.length; i++) {
                const product = await checkExist('product', 'id', comboDetails[i].product_id.toString())
                if (!product) {
                    return new HttpException(404, errorMessages.NOT_EXISTED)
                }
                const matchingComboDetail = currentComboDetail.find((item: any) => item.product_id === comboDetails[i].product_id)
                if (!matchingComboDetail) {
                    const reasonItem = {
                        action: 'Đã thêm vào combo sản phẩm',
                        product_code: product[0].code,
                        quantity: comboDetails[i].quantity,
                        price_combo: comboDetails[i].price_combo
                    }
                    reason.push(reasonItem)
                }
                else {
                    if (comboDetails[i].price_combo != matchingComboDetail.price_combo) {
                        const reasonItem = {
                            action: 'Đã cập nhật giá sản phẩm',
                            product_code: product[0].code,
                            price_combo: comboDetails[i].price_combo
                        }
                        reason.push(reasonItem)
                    }
                    if (comboDetails[i].quantity != matchingComboDetail.quantity) {
                        const reasonItem = {
                            action: 'Đã cập nhật số lượng sản phẩm',
                            product_code: product[0].code,
                            quantity: comboDetails[i].quantity
                        }
                        reason.push(reasonItem)
                    }
                }
            }
            for (let i = 0; i < currentComboDetail.length; i++) {
                const matchingComboDetail = comboDetails.find((item: any) => item.product_id === currentComboDetail[i].product_id)
                if (!matchingComboDetail) {
                    const reasonItem = {
                        action: 'Đã xóa khỏi combo sản phẩm',
                        product_code: currentComboDetail[i].product_code
                    }
                    reason.push(reasonItem)
                }
            }
        }
        console.log(reason.join('\n'))

        const listImage = listImageFiles ? listImageFiles.files : []
        let code = model.code
        let check: any = null
        let resultImage: any[] = []
        check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED);
        if (listImage !== undefined && listImage.length > 0) {
            const countImage = await database.executeQuery(`select count(*) as total from product_image where product_id = ${id}`)
            if ((countImage as any)[0].total + listImage.length > process.env.PRODUCT_IMAGE_QUANTITY! as any as number)
                return new HttpException(400, errorMessages.INVALID_FILE_QUANTITY, 'files');
            const maxFileSize = process.env.PRODUCT_UPLOAD_IMAGE_SIZE! as any as number;
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
            const isAllowedMimeType = listImage.every((file: any) => allowedMimeTypes.includes(file.mimetype));
            if (!isAllowedMimeType)
                return new HttpException(400, errorMessages.INVALID_FILE)
            if (listImage.some((file: any) => file.size > maxFileSize))
                return new HttpException(400, errorMessages.INVALID_FILE_SIZE)
        }

        let query = `update ${this.tableName} set `
        const values = []
        if (model.name) {
            query += ' name = ? , '
            values.push(model.name)
        }
        if (model.price) {
            query += ' price = ? , '
            values.push(model.price)
        }
        if (model.publish != undefined) {
            query += ' publish = ? , '
            values.push(model.publish)
        }
        if (model.is_topdeal != undefined) {
            query += ' is_topdeal = ? , '
            values.push(model.is_topdeal)
        }
        if (model.weight != undefined) {
            query += ' weight = ? , '
            values.push(model.weight)
        }
        if (model.brand_origin != undefined) {
            query += ' brand_origin = ? , '
            values.push(model.brand_origin)
        }
        if (model.made_in != undefined) {
            query += ' made_in = ? , '
            values.push(model.made_in)
        }
        if (model.unit_id != undefined) {
            query += ' unit_id = ? , '
            values.push(model.unit_id)
        }
        if (model.brand_id != undefined) {
            query += ' brand_id = ? , '
            values.push(model.brand_id || null)
        }
        if (model.product_type_id != undefined) {
            query += ' product_type_id = ? , '
            values.push(model.product_type_id || null)
        }
        if (model.description != undefined) {
            query += ' description = ? , '
            values.push(model.description)
        }
        if (model.is_sell != undefined) {
            query += ' is_sell = ? , '
            values.push(model.is_sell || 1)
        }
        if (model.seller_id != undefined) {
            query += ' seller_id = ? , '
            values.push(model.seller_id)
        }
        if (model.content != undefined) {
            query += ' content = ? , '
            values.push(model.content || '')
        }
        if (model.detail_info != undefined) {
            query += ' detail_info = ? , '
            values.push(model.detail_info || '')
        }
        if (model.highlights != undefined) {
            query += ' highlights = ? , '
            values.push(model.highlights || '')
        }
        if (model.title != undefined) {
            query += ' title = ? , '
            values.push(model.title || '')
        }
        if (model.meta_description != undefined) {
            query += ' meta_description = ? , '
            values.push(model.meta_description || '')
        }
        if (model.category_id != undefined) {
            query += ' category_id = ? , '
            values.push(model.category_id || null)
        }
        if (model.tax_apply != undefined) {
            query += ' tax_apply = ? , '
            values.push(model.tax_apply || 0)
        }
        if (model.notify != undefined) {
            query += ' notify = ? , '
            values.push(model.notify)
        }
        if (model.is_authentic != undefined) {
            query += ' is_authentic = ? , '
            values.push(model.is_authentic || 0)
        }
        if (model.is_freeship != undefined) {
            query += ' is_freeship = ? , '
            values.push(model.is_freeship || 0)
        }
        if (model.can_return != undefined) {
            query += ' can_return = ? , '
            values.push(model.can_return || 0)
        }
        if (model.max_inventory != undefined) {
            query += ' max_inventory = ? , '
            values.push(model.max_inventory || null)
        }
        if (model.weight_id != undefined) {
            query += ' weight_id = ? , '
            values.push(model.weight_id || 1)
        }
        if (model.min_inventory != undefined) {
            query += ' min_inventory = ? , '
            values.push(model.min_inventory || null)
        }
        if (model.publish_yomart != undefined) {
            query += ' publish_yomart = ? , '
            values.push(model.publish_yomart)
        }
        // create slug from name
        if (model.name && model.name != '') {
            let slug = convertStringToSlug(model.name);
            query += ' slug = ? , '
            values.push(slug || '')
        }
        if (model.commission != undefined) {
            const commission: ProductCommission = {
                product_id: id,
                commission: model.commission > 0 ? model.commission : 0,
                created_id: model.created_id,
                seller_id: model.seller_id
            }
            try {
                await this.productCommissionService.update(commission, id);
            } catch (error) { }
        }
        // cập nhật thông tin thuế
        if (!!Number(model.tax_apply)) {
            try {
                const productTaxDataInsert: ProductTax = {
                    tax_vat_in: model.tax_vat_in,
                    tax_vat_out: model.tax_vat_out,
                    tax_product_apply: model.tax_product_apply
                }
                await this.productTaxService.updateByProductId(productTaxDataInsert, id)
            } catch (error) {
                return new HttpException(500, errorMessages.UPDATE_FAILED);
            }
        }
        else {
            try {
                await this.productTaxService.delete(id)
            } catch (error) {
                return new HttpException(500, errorMessages.UPDATE_FAILED);
            }
        }

        // cập nhật thông tin bảo hành
        if ((model.warranty_period) || (model.warranty_place && model.warranty_place != '') || (model.warranty_form && model.warranty_form != '')) {
            try {
                const warrantyRow = await this.warrantyService.getOne(id);
                const warrantyDataUpdate: WarrantyDto = {
                    warranty_period: model.warranty_period || 0,
                    warranty_place: model.warranty_place,
                    warranty_form: model.warranty_form,
                    warranty_instructions: model.warranty_instructions,
                }
                if (Array.isArray(warrantyRow) && warrantyRow.length > 0) {
                    await this.warrantyService.update(warrantyDataUpdate, id);
                } else {
                    warrantyDataUpdate.product_id = id;
                    warrantyDataUpdate.seller_id = model.seller_id;
                    warrantyDataUpdate.created_id = model.created_id;
                    await this.warrantyService.create(warrantyDataUpdate);
                }
            } catch (error) {
                return new HttpException(500, errorMessages.UPDATE_FAILED);
            }
        }


        query += `updated_at = ? where id = ?`;
        const update_at = new Date();
        values.push(update_at);
        values.push(parseInt(id as any));

        let log: Ilog = {
            user_id: model.created_id!,
            action: 'update',
            module_id: 5,
            des: 'đã chỉnh sửa combo',
            reference_id: id,
            reason: JSON.stringify(reason)
        }
        console.log('log', log)
        const result = await database.executeQueryHistory(query, values, log) as any;






        if (result.affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        if (listImage && listImage.length > 0) {
            const lastRow = await database.executeQuery(`SELECT * FROM product_image WHERE product_id =${id} order by id DESC limit 1`)
            let num
            if ((lastRow as any).length > 0) {
                const match = (lastRow as RowDataPacket)[0].image.match(/_(\d+)\./);
                num = match ? parseInt(match[1]) : 0;
            }

            const imageNames = this.convertToImageName((check as any)[0].name, listImage, num)
            const listPath: string[] = await Promise.all(await this.awaitUploadImage((check as any)[0].code, listImage, imageNames))
            for (let i = 0; i < listPath.length; i++) {
                let modelProductImage: ProductImage = {
                    product_id: check[0].id,
                    image: listPath[i],
                    created_id: model.created_id,
                    publish: model.publish ?? 1
                }
                await this.productImageService.create(modelProductImage).then((result) => {
                    const path = this.rePathOfImage([listPath[i]], check[0].code)
                    const pathThumbnail = this.rePathOfImage([listPath[i]], check[0].code, 'thumbnail');
                    (result as RowDataPacket).data.image = path[0];
                    (result as RowDataPacket).data.image_thumbnail = pathThumbnail[0];
                    resultImage.push((result as any).data)
                })
            }
        }
        if (code && code.length > 0) {
            const oldPath = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string, (check as any)[0].code)
            const newPath = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string, code)
            await this.renameDirectory(oldPath, newPath)
        }
        if (model.combo_details && model.combo_details.length > 0) {
            const combo_details = await this.productComboDetailService.getByComboId(id) as RowDataPacket
            const combo_details_ids = combo_details.data.map((item: any) => item.id)
            console.log(combo_details_ids)
            await this.productComboDetailService.deleteRows(combo_details_ids)
            for (const comboDetail of model.combo_details) {
                await this.productComboDetailService.create({ ...comboDetail, combo_id: id })
            }
        }
        return {
            data: {
                id,
                code,
                ...model,
                iamges: resultImage,
                updated_at: update_at
            }
        }
    }
    private renameDirectory = async (oldPath: string, newPath: string) => {
        try {
            fs.rename(oldPath, newPath, (error) => {
                if (error) {
                    return new HttpException(500, errorMessages.UPDATE_FAILED)
                } else {
                    return null
                }
            });
            return true
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED)
        }
    }


    public getComboProduct = async (key: string, seller_id: number, pageInput?: number, limitInput?: number) => {
        const query = `
           SELECT p.id, p.code, p.name, p.price,
                GROUP_CONCAT(
                    DISTINCT 
                    CASE 
                        WHEN pi.image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'id', pi.id,
                                'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', 
                                    COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/', pi.image),
                                'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', 
                                    COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/thumbnail/', pi.image)
                            )
                        ELSE NULL 
                    END
                ) AS images,
                GROUP_CONCAT(
                    DISTINCT 
                    JSON_OBJECT(
                        'id', pcd.id,
                        'code', (select code from product where id = pcd.product_id),
                        'product_id', pcd.product_id,
                        'quantity', pcd.quantity,
                        'price', pcd.price,
                        'total_price', pcd.price * pcd.quantity,
                        'name', (select name from product where id = pcd.product_id),
                        'image', IFNULL((select CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', pcd.product_id, '/', pi.image) from product_image pi where product_id = pcd.product_id limit 1), null)
                    )
                ) AS combo_details
            FROM product p  
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN warehouse w ON w.product_id = p.id
            LEFT JOIN product_combo_detail pcd ON pcd.combo_id = p.id
            LEFT JOIN branch br ON w.branch_id = br.id
            LEFT JOIN product_type pt ON p.product_type_id = pt.id
            LEFT JOIN supplier sp ON p.supplier_id = sp.id
            LEFT JOIN product_category c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_id = u.id
            LEFT JOIN brand b ON p.brand_id = b.id 
            LEFT JOIN product_commission pc ON p.id = pc.product_id
            LEFT JOIN product_image pi ON pi.product_id = p.id 
                AND pi.id = (SELECT MIN(id) FROM product_image WHERE product_image.product_id = p.id)

            WHERE p.seller_id = ? AND p.type = 'combo' ${key !== undefined ? ` and p.name like '%${key}%' ` : ` `}

            GROUP BY p.id, p.seller_id 
            ORDER BY p.id DESC
        `
        const result = await database.executeQuery(query, [seller_id]) as RowDataPacket
        return {
            data: result.map((item: any) => { return { ...item, images: JSON.parse(item.images) } })
        }
    }

    public updatePublish = async (id: number) => {
        const check = await checkExist('product', 'id', id.toString())
        if (check == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        let query = ''
        if (check[0].publish == 1) {
            query = `
                UPDATE product SET publish = 0 WHERE id = ?
            `
        } else {
            query = `
                UPDATE product SET publish = 1 WHERE id = ?
            `
        }
        const result = await database.executeQuery(query, [id]) as RowDataPacket
        if (result.affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
    }

}

export default ProductComboService;
