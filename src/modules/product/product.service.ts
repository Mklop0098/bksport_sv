import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IError, IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodeWithSeller } from "@core/utils/gennerate.code";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import { CreateDto as ProductImage } from "@modules/productImage";
import ProductIamgeService from "@modules/productImage/service";
import { addCollate } from "@core/utils/addCollate";
import ProductUnitService from "@modules/productUnit/service";
import ProductTypeService from "@modules/productType/service";
import Ilog from "@core/interfaces/log.interface";
import ProductCommissionService from "@modules/productCommission/service";
import { CreateDto as ProductCommission } from "@modules/productCommission";
import { CreateDto as ProductTax } from "@modules/productTaxConfig";
import WarrantyService from "@modules/warranty/service";
import { WarrantyDto } from "@modules/warranty";
import { convertStringToSlug } from "@core/utils/convertStringToSlug";
import ProductTaxConfigService from "@modules/productTaxConfig/service";
import BrandService from "@modules/brand/service";
import WarehouseService from "@modules/warehouse/service";
import { CreateDto as PurchaseOrderDto } from "@modules/purchaseOrder/dtos/create.dto";
import { CreateDto as productUnitDto } from "@modules/productUnit/dtos/create.dto";
import { CreateDto as productTypeDto } from "@modules/productType/dtos/create.dto";
import { CreateDto as brandDto } from "@modules/brand/dtos/create.dto";
import PurchaseOrderService from "@modules/purchaseOrder/service";
import { StatusOrder } from "@modules/purchaseOrder/interface";
import ProductAttributesService from "@modules/productAttributes/service";
import { CreateDto as ProductAttributesDto } from '@modules/productAttributes/dtos/create.dto'
import { CreateDto as AttributeDetailDto } from '@modules/productAttributes/dtos/create.dto'
import ProductAttributeDetailService from "@modules/productAttributeDetail/service";
import ProductCategoryService from "@modules/product_category/service";
import ProductComboDetailService from "@modules/productComboDetail/service";
import SlugService from "@modules/slug/service";
import axios from "axios";
class ProductService {
    private tableName = 'product';
    private fieldId = 'id'
    private fieldCode = 'code'
    private productImageService = new ProductIamgeService()
    private productUnitService = new ProductUnitService()
    private productTypeService = new ProductTypeService()
    private brandService = new BrandService()
    private moduleId = 5;
    private productCommissionService = new ProductCommissionService()
    private warrantyService = new WarrantyService()
    private categoryService = new ProductCategoryService()
    private productTaxService = new ProductTaxConfigService()
    private purchaseOrderService = new PurchaseOrderService()
    private productAttributeService = new ProductAttributesService()
    private productAttributeDetailService = new ProductAttributeDetailService()
    private warehouseService = new WarehouseService()
    private productComboDetailService = new ProductComboDetailService()
    private productCategoryService = new ProductCategoryService()
    private slugService = new SlugService()
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

    public createProductJSON = async (model: CreateDto, listImageObject: any) => {
        if (model.attributes_json) {
            model.attributes = JSON.parse(model.attributes_json!)
        }
        if (model.sub_products_json) {
            model.sub_products = JSON.parse(model.sub_products_json)
        }
        let listImage = listImageObject?.files ?? listImageObject;



        let sellerCodeQuery = `SELECT code from seller WHERE id = ?`
        const sellerCode = await database.executeQuery(sellerCodeQuery, [model.seller_id]) as RowDataPacket

        if (model.price && model.price_sale && Number(model.price) < Number(model.price_sale)) {
            return new HttpException(400, errorMessages.PRICE_SALE_GREATER_THAN_PRICE, 'price_sale')
        }
        model.unit_id = (model.unit_id as any * 1)
        let code: string;
        if (listImage !== undefined && listImage.length > 10)
            return new HttpException(400, errorMessages.INVALID_FILE_QUANTITY, 'files');
        let imageNames;
        //console.log(listImage, 'aaa')
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
            if (code && await checkExist(this.tableName, this.fieldCode, sellerCode[0].code + code))
                return new HttpException(400, errorMessages.CODE_EXISTED, this.fieldCode);
        } else code = await generateCodeWithSeller(this.tableName, 'SP', 8, model.seller_id as number) as string;

        // set title
        if (!model.title || model.title == '') {
            model.title = model.name;
        }
        // create slug from name
        let slug = '';
        if (model.name && model.name != '') {
            slug = (await this.slugService.genSlug(model.name!)).data
        }


        const create_at = new Date()
        const update_at = new Date()
        let query = ` insert into ${this.tableName} (code, name, publish, is_topdeal, weight, unit_id, price, price_wholesale, price_sale, price_import, brand_id, product_type_id, description , is_sell, created_id, created_at, updated_at, supplier_id, seller_id, content, detail_info, highlights, title, meta_description, slug, category_id, tax_apply, notify, is_authentic, is_freeship, can_return, max_inventory, min_inventory, parent_id, attributes, weight_id, publish_yomart, brand_origin, made_in, type) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`
        let values = [
            code,
            model.name,
            model.publish ?? 1,
            model.is_topdeal ?? 1,
            model.weight || null,
            model.unit_id || null,
            model.price || 0,
            model.price_wholesale || 0,
            model.price_sale || 0,
            model.price_import || 0,
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
            model.parent_id || 0,
            (!model.parent_id || model.parent_id === 0) ? null : model.product_attribute,
            model.weight_id || 1,
            model.publish_yomart || 0,
            model.brand_origin || null,
            model.made_in || null,
            model.type || 'normal'
        ]
        const result = await database.executeQuery(query, values) as any;

        // const result = await database.executeQuery(query, values);
        if (result.affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED);
        if ((!model.parent_id || model.parent_id === 0) && (model.attributes && model.attributes.length > 0)) {
            for (const element of model.attributes) {
                if (element.values.length > 0) {
                    const attributeModel: ProductAttributesDto = {
                        name: element.name,
                        product_parent_id: result.insertId,
                        values: element.values
                    }
                    const data = await this.productAttributeService.create(attributeModel)
                    //console.log("data", data)
                }
            }
        }
        let purchase_order_detail_list = []
        let amount_paid = 0
        if (model.sub_products && model.sub_products.length > 0) {
            for (const element of model.sub_products) {
                //console.log(element)
                const atts = element.name_att.replace(/\s*-\s*/g, '-').split('-')
                let att = ''
                if (atts.length > 0) {
                    let values = [];
                    for (const item of atts) {
                        values.push(`pad.value = "${item}"`);
                    }

                    const query = `
                    SELECT GROUP_CONCAT(pad.id SEPARATOR '-') AS merged_ids
                    FROM product_attribute_detail pad
                    LEFT JOIN product_attributes pa ON pa.id = pad.attribute_id
                    WHERE (${values.join(' OR ')}) 
                    AND pa.product_parent_id = ${result.insertId};
                    `
                    //console.log(query)
                    const data = await database.executeQuery(query) as RowDataPacket
                    if (data.length > 0) {
                        att = data[0].merged_ids
                    }
                }
                const productModel: CreateDto = {
                    parent_id: result.insertId,
                    name: model.name + "-" + element.name_att,
                    price: element.price || 0,
                    price_wholesale: element.price_wholesale || 0,
                    price_import: Number(element.price_import) || Number(model.price_import),
                    weight: element.weight || null,
                    weight_unit: element.unit_id || 1,
                    created_id: model.created_id,
                    seller_id: model.seller_id,
                    product_attribute: att || '',
                    unit_id: model.unit_id,
                    product_type_id: model.product_type_id,
                    max_inventory: model.max_inventory,
                    min_inventory: model.min_inventory,
                    prefix_quantity: element.prefix_quantity || 0,
                    commission: model.commission,
                    tax_vat_in: model.tax_vat_in,
                    tax_vat_out: model.tax_vat_out,
                    warranty_period: model.warranty_period,
                    warranty_place: model.warranty_place,
                    warranty_form: model.warranty_form,
                    warranty_instructions: model.warranty_instructions,
                    detail_info: model.detail_info,
                    description: model.description,
                    highlights: model.highlights,
                    is_topdeal: model.is_topdeal,
                    brand_id: model.brand_id,
                    is_sell: model.is_sell,
                    supplier_id: model.supplier_id,
                    content: model.content,
                    title: model.title || model.name,
                    category_id: model.category_id,
                    tax_apply: model.tax_apply,
                    notify: model.notify,
                    is_authentic: model.is_authentic,
                    is_freeship: model.is_freeship,
                    can_return: model.can_return,
                    prime_cost: element.prime_cost || element.price_import || model.price_import,
                    brand_origin: model.brand_origin,
                    made_in: model.made_in,
                    publish_yomart: model.publish_yomart || 0,
                    type: model.type || 'normal'
                }
                // const product = await this.createProductJSON(productModel, listImage, element.image || '', imageNames)
                let product
                if (listImage && listImage.length > 0) {
                    let imageIndex
                    if (element.image) {
                        imageIndex = listImage.findIndex((img: any) => img.originalname?.trim() === element.image.trim())
                    }
                    const listPath: string[] = await Promise.all(await this.awaitUploadImage(code, listImage, imageNames, false))
                    product = await this.createProduct(productModel, listPath[imageIndex], false)
                }
                else {
                    product = await this.createProduct(productModel, undefined, false)
                }
                let productId = (product as any).data.id
                //console.log(productId)
                if (productModel.prefix_quantity && productModel.prefix_quantity > 0) {
                    purchase_order_detail_list.push({
                        product_id: productId,
                        quantity: Number(productModel.prefix_quantity),
                        price: Number(productModel.prime_cost) || Number(productModel.price_import) || 0,
                        created_id: model.created_id,
                        discount_value: 0,
                        discount_type: 0,
                        seller_id: model.seller_id,
                    })
                    amount_paid += (Number(productModel.prime_cost) || Number(productModel.price) || 0) * Number(productModel.prefix_quantity)
                }
            }
            //console.log(purchase_order_detail_list)
            if (purchase_order_detail_list.length > 0) {
                await this.purchaseMultipleProduct(model, purchase_order_detail_list, amount_paid)
            }

        }
        else if (model.prefix_quantity && model.prefix_quantity > 0) {
            await this.purchaseOrderCreate(model, (result as RowDataPacket).insertId)
        }
        let productId = (result as RowDataPacket).insertId
        // upload and save img list
        let resultImage: any[] = []
        if (Array.isArray(listImage) && listImage.length > 0) {
            const listPath: string[] = await Promise.all(await this.awaitUploadImage(code, listImage, imageNames))
            for (let i = 0; i < listPath.length; i++) {
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
        // tao slug
        await this.slugService.create('product', slug)
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

    private purchaseMultipleProduct = async (model: CreateDto, order_list: any[], amount_paid: number) => {
        //console.log(order_list, amount_paid)
        const user_branch_ids = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [model.created_id]) as RowDataPacket
        let branch_id = 0
        if (user_branch_ids.length === 1 && !user_branch_ids.map((item: any) => item.branch_id).includes(0)) {
            branch_id = user_branch_ids[0].branch_id
        } else {
            const branchQuery = `SELECT id as branch_id from branch where seller_id = ? and is_default = 1`
            const branch = await database.executeQuery(branchQuery, [model.seller_id]) as RowDataPacket
            branch_id = branch[0].branch_id
        }
        const purchaseOrder: PurchaseOrderDto = {
            created_id: model.created_id,
            supplier_id: model.supplier_id || 0,
            branch_id: branch_id,
            seller_id: model.seller_id,
            type: 'import-warehouse-beginning',
            order_status_payment_history: [
                {
                    payment_method: 'tien_mat',
                    amount_paid: amount_paid
                }
            ],
            order_status_history: [
                {
                    status: StatusOrder.CREATE_VARIANT
                },
                {
                    status: StatusOrder.IMPORT
                },
                {
                    status: StatusOrder.COMPLETED
                },
            ],
            order_details: order_list
        }
        //console.log('aaaaaa', purchaseOrder)
        await this.purchaseOrderService.create(purchaseOrder)
    }


    private purchaseOrderCreate = async (model: CreateDto, productId: number) => {
        const user_branch_ids = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [model.created_id]) as RowDataPacket
        let branch_id = 0
        if (user_branch_ids.length === 1 && !user_branch_ids.map((item: any) => item.branch_id).includes(0)) {
            branch_id = user_branch_ids[0].branch_id
        } else {
            const branchQuery = `SELECT id as branch_id from branch where seller_id = ? and is_default = 1`
            const branch = await database.executeQuery(branchQuery, [model.seller_id]) as RowDataPacket
            branch_id = branch[0].branch_id
        }
        const purchaseOrder: PurchaseOrderDto = {
            created_id: model.created_id,
            supplier_id: model.supplier_id || 0,
            branch_id: branch_id,
            seller_id: model.seller_id,
            type: 'import-warehouse-beginning',
            order_status_payment_history: [
                {
                    payment_method: 'tien_mat',
                    amount_paid: (Number(model.prime_cost) || Number(model.price) || 0) * Number(model.prefix_quantity)
                }
            ],
            order_status_history: [
                {
                    status: StatusOrder.CREATE_VARIANT
                },
                {
                    status: StatusOrder.IMPORT
                },
                {
                    status: StatusOrder.COMPLETED
                },
            ],
            order_details: [{
                product_id: productId,
                quantity: Number(model.prefix_quantity),
                price: Number(model.prime_cost) || Number(model.price) || 0,
                created_id: model.created_id,
                discount_value: 0,
                discount_type: 0,
                seller_id: model.seller_id,
            }]
        }
        await this.purchaseOrderService.create(purchaseOrder)
    }

    private getFileNameFromUrl = async (url: string) => {
        const parts = url.split('/');
        return parts.pop();
    }
    public deleteOneImage = async (id: number, imageIndex: string) => {
        console.log(id, imageIndex)
        let image = await this.getFileNameFromUrl(imageIndex);
        console.log(image)
        const check = await checkExist(this.tableName, this.fieldId, id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED, this.fieldId);
        const imageList = (check as any)[0].image_list;
        const listImage = JSON.parse(imageList);
        const index = listImage.indexOf(image);
        if (index == -1)
            return new HttpException(404, errorMessages.NOT_EXISTED, 'image');
        listImage.splice(index, 1);
        const updated_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const image_list = JSON.stringify(listImage)
        let query = `update product set `
        const values = [];
        if (image_list) {
            query += 'image_list = ?, ';
            values.push(image_list);
        }
        query += `updated_at = ? where id = ?`;
        values.push(updated_at);
        values.push(id);
        try {
            const result = await database.executeQuery(query, values);
            if ((result as any).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            return {
                data: {
                    id: id,
                    image_list: image_list,
                    updated_at: updated_at
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED)
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
    public updateProduct = async (model: CreateDto, id: number, listImage: any) => {
        let code = model.code
        let check: any = null
        let resultImage: any[] = []
        check = await checkExist(this.tableName, this.fieldId, id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED, this.fieldId);
        if (model.price && model.price_sale && Number(model.price) < Number(model.price_sale)) {
            return new HttpException(400, errorMessages.PRICE_SALE_GREATER_THAN_PRICE, 'price_sale')
        }
        if (listImage !== undefined && listImage.length > 0) {
            const countImage = await database.executeQuery(`select count(*) as total from product_image where product_id = ${id}`)
            if ((countImage as any)[0].total + listImage.length > process.env.PRODUCT_IMAGE_QUANTITY! as any as number)
                return new HttpException(400, errorMessages.INVALID_FILE_QUANTITY, 'files');
        }
        if (listImage !== undefined) {
            const maxFileSize = process.env.PRODUCT_UPLOAD_IMAGE_SIZE! as any as number;
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
            const isAllowedMimeType = listImage.every((file: any) => allowedMimeTypes.includes(file.mimetype));
            if (!isAllowedMimeType)
                return new HttpException(400, errorMessages.INVALID_FILE)
            if (listImage.some((file: any) => file.size > maxFileSize))
                return new HttpException(400, errorMessages.INVALID_FILE_SIZE)
        }

        const slugGen = await this.slugService.genSlug(model.name!)
        const oldSlug = await database.executeQuery(`select slug from ${this.tableName} where id = ?`, [id]) as RowDataPacket
        const slug = model.slug || slugGen.data

        if (oldSlug.length > 0 && oldSlug[0].slug !== slug) {
            const check = await this.slugService.checkSlug('product', slug)
            console.log(oldSlug[0].slug, slug, check)
            if (check instanceof Error) {
                return new HttpException(400, 'Địa chỉ slug đã tồn tại', 'slug')
            }
            await this.slugService.update('product', slug, oldSlug[0].slug)
        }


        let query = `update ${this.tableName} set `
        const values = []
        if (model.name) {
            query += ' name = ? , '
            values.push(model.name)
        }
        if (model.product_attribute) {
            query += ' attributes = ? , '
            values.push(model.product_attribute)
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
        if (model.price != undefined) {
            query += ' price = ? , '
            values.push(model.price || 0)
        }
        if (model.price_wholesale != undefined) {
            query += ' price_wholesale = ? , '
            values.push(model.price_wholesale || 0)
        }
        if (model.price_sale != undefined) {
            query += ' price_sale = ? , '
            values.push(model.price_sale || 0)
        }
        if (model.price_import != undefined) {
            query += ' price_import = ? , '
            values.push(model.price_import || 0)
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
            query += ' slug = ? , '
            values.push(slug)
        }
        if (model.commission != undefined) {
            const commission: ProductCommission = {
                product_id: id,
                commission: model.commission,
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

        const result = await database.executeQuery(query, values) as RowDataPacket;
        // const result = await database.executeQuery(query, values);
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
        await this.slugService.create('product', slug)
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

    public delete = async (id: number, model: CreateDto) => {
        const exist = await database.executeQuery(`select * from product where id = ${id}`) as RowDataPacket
        if (exist.length < 0)
            return new HttpException(404, errorMessages.NOT_EXISTED, this.fieldId);
        const codeQuery = `SELECT code FROM product WHERE id = ${id};`
        const code = await database.executeQuery(codeQuery)
        if (Array.isArray(code) && code.length > 0) {
            const folderPath = path.resolve(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH + `/${(code[0] as any).code}`)
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
        const log: Ilog = {
            action: errorMessages.DELETE,
            user_id: model.created_id!,
            module_id: this.moduleId,
        }
        const checkParent = await database.executeQuery(`
            select p.id, count(distinct p1.id) as count from product p 
            left join product p1 on p1.parent_id = p.id
            where p1.parent_id = (select parent_id from product where id = ${id})
            `) as RowDataPacket
        if (checkParent.length > 0) {
            if (checkParent[0].count === 1) {
                await this.delete(checkParent[0].id, model)
            }
        }
        //console.log(exist[0])
        if (exist[0].parent_id && exist[0].attributes) {
            const att_id = exist[0].attributes.split('-')
            for (const element of att_id) {
                const checkCanDelete = await database.executeQuery(
                    `
                            SELECT id
                            FROM product
                            WHERE (attributes LIKE '${element}-%'   
                            OR attributes LIKE '%-${element}-%'
                            OR attributes LIKE '%-${element}'   
                            OR attributes = '${element}')       
                            AND parent_id = (select parent_id from product where id = ${id})
                    `
                ) as RowDataPacket
                //console.log(element, checkCanDelete)
                if (checkCanDelete.length === 1) {
                    const res = await this.productAttributeDetailService.deleteWithoutDeleteProduct(element)
                    //console.log(res)
                }
            }
        }
        const result = await database.executeQueryLog(`delete from ${this.tableName} where id = ?`, [id], log);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);

        try {
            await this.productImageService.deleteByProductId(id) // xóa hình ảnh
            await this.productTaxService.delete(id) // xóa thông tin thuế
            await this.productCommissionService.deleteByProductId(id);
            await this.warrantyService.delete(id);
            const sub_products = await database.executeQuery(`SELECT id from product where parent_id = ${id}`) as RowDataPacket
            if (sub_products.length > 0) {
                for (const element of sub_products.map((i: any) => i.id)) {
                    await this.warehouseService.deleteProductOfSeller(element, model.seller_id!)
                    await this.delete(element, model)
                }
            }
            else await this.warehouseService.deleteProductOfSeller(id, model.seller_id!)
            await this.slugService.delete('product', exist[0].slug)

        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED);
        }
        return {
            data: {
                id: id,
                message: errorMessages.DELETE_SUCCESS
            }
        }
    }
    public findById = async (id: number) => {
        let resultImage;
        let query = `select p.*, pt.id as product_type_id, pt.name as product_type_name, b.id as brand_id, b.name as brand_name, pu.name as unit_name, group_concat(pi.image) as images 
        from ${this.tableName} p 
        left join product_type pt on p.product_type_id = pt.id 
        left join brand b on p.brand_id = b.id 
        left join product_image pi on pi.product_id = p.id 
        left join product_unit pu on p.unit_id = pu.id  
        where p.id = ? 
        group by p.id, pt.id, b.id`;
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED + 'product');
        const result = await database.executeQuery(query, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_EXISTED + 'product');
        let queryImage = `select * from product_image where product_id = ?`
        resultImage = await database.executeQuery(queryImage, [id]);
        if (Array.isArray(resultImage) && resultImage.length === 0) {
            // return new HttpException(404, errorMessages.NOT_EXISTED + 'image');
        }
        if (Array.isArray(result) && result.length > 0 && Array.isArray(resultImage) && resultImage.length > 0) {
            for (let i = 0; i < result.length; i++) {
                (resultImage as any)[i].image_thumbnail = this.convertPathOfImage((resultImage as any)[i].image, (result as any)[i].code, 'thumbnail');
                (resultImage as any)[i].image = this.convertPathOfImage((resultImage as any)[i].image, (result as any)[i].code);
                (result as any)[i].images = resultImage;
            }
        }
        return {
            data: {
                ...(result as RowDataPacket[])[0],
            }
        }
    }
    public findByIdUpdate = async (id: number) => {
        // let query = `select p.*, ptx.tax_vat_in, ptx.tax_vat_out, ptx.tax_product_apply, c.id as category_id, c.name as category_name, pt.id as product_type_id, pt.name as product_type_name, b.id as brand_id, b.name as brand_name, pu.name as unit_name , group_concat(pi.image) as images, pc.commission as commission, w.warranty_period, w.warranty_place, w.warranty_form, w.warranty_instructions
        let query = `
        select pc.commission, p.*, ptx.tax_vat_in, ptx.tax_vat_out, ptx.tax_product_apply, c.id as category_id, c.name as category_name, pt.id as product_type_id, pt.name as product_type_name, b.id as brand_id, b.name as brand_name, pu.name as unit_name , group_concat(pi.image) as images, pc.commission as commission, w.warranty_period, w.warranty_place, w.warranty_form, w.warranty_instructions,
        IFNULL((
            select sum(od.quantity) as sum from orders o 
            LEFT JOIN order_detail od on o.id = od.order_id
            WHERE (o.status <= 3 or o.status = 7) and od.product_id = war.product_id and od.seller_id = war.seller_id), 0) as available,
        sum(war.quantity) as inventory,
        (
			select
            GROUP_CONCAT(
                DISTINCT 
                JSON_OBJECT(
                    'name', pa.name,
                    'value', pad.value,
                    'product_attributes_id', pa.id
                )
            ) AS attributes
            from product_attribute_detail pad 
            left join product_attributes pa on pa.id = pad.attribute_id
            where pa.product_parent_id = p.id
        ) as attributes,
        CONCAT(REPLACE(p.attributes, '-', ',')) as attribute_list,
        GROUP_CONCAT(
            DISTINCT 
            CASE 
                WHEN (select count(id) from product where parent_id = p.id) != 0 THEN 
                    JSON_OBJECT(
                        'id', p1.id
                    )
                ELSE NULL 
            END
        ) AS child_id,
        GROUP_CONCAT(
            DISTINCT 
            CASE 
                WHEN pi.image IS NOT NULL THEN 
                    JSON_OBJECT(
                        'id', pi.id,
                        'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', IFNULL((select code from product where id = (select parent_id from product where id = p.id)), p.code), '/', pi.image),
                        'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', IFNULL((select code from product where id = (select parent_id from product where id = p.id)), p.code), '/thumbnail/', pi.image)
                    )
                ELSE NULL 
            END
        ) AS images,
        wu.name as weight_name
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
        let childs = []
        if (result[0].child_id) {
            const data = await this.findAllChildrent(JSON.parse('[' + result[0].child_id + ']').map((child: any) => child.id))
            childs = data
        }
        let attributes_list
        if (result[0].attribute_list && result[0].attribute_list.length > 0) {
            //console.log('aaaaaaaa', result[0].attribute_list)
            const attQuery = `
            select
            GROUP_CONCAT(
                DISTINCT 
                JSON_OBJECT(
                    'name', pa.name,
                    'value', pad.value,
                    'product_attributes_id', pa.id,
                    'product_attribute_detail_id', pad.id
                )
            ) AS attributes
            from product_attribute_detail pad 
            left join product_attributes pa on pa.id = pad.attribute_id
            where pad.id in (${result[0].attribute_list.split(',')})
            `
            const atts = await database.executeQuery(attQuery) as RowDataPacket
            if (atts.length > 0) {
                attributes_list = JSON.parse('[' + atts[0].attributes + ']')
            }
        }
        let attributes

        if (result[0].attributes && result[0].attributes != null) {
            //console.log(JSON.parse('[' + result[0].attributes + ']'))
            attributes = Object.values(
                JSON.parse('[' + result[0].attributes + ']').reduce((acc: any, item: any) => {
                    if (!acc[item.name]) {
                        acc[item.name] = { name: item.name, product_attributes_id: item.product_attributes_id, values: [] };
                    }
                    acc[item.name].values.push(item.value);
                    return acc;
                }, {})
            );
        }

        //console.log(attributes)
        delete result[0].child_id
        delete result[0].attributes
        return {
            data: {
                // ...resultData,
                ...result[0],
                images: result[0].images ? JSON.parse('[' + result[0].images + ']') : [],
                unit_id: result[0].unit_id && Number(result[0].unit_id),
                childs: childs,
                available: Number(result[0].inventory) - Number(result[0].available),
                is_sell_name: this.convertIsSellToIsSellName((result as any)[0].is_sell),
                attributes_list,
                attributes
            }
        }
    }

    public findAllChildrent = async (ids: number[]) => {
        const childs = []
        for (const id of ids) {
            const child: any = await this.findByIdUpdate(id)

            childs.push((child as any).data)
        }
        return childs
    }

    private convertPathOfImage = (image: string, code: string, type?: string) => {
        let userDir = ''
        if (type === 'thumbnail') {
            userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code, 'thumbnail');
        }
        else {
            userDir = path.join(process.env.PRODUCT_UPLOAD_IMAGE as string, code);
        }
        const rePath = path.join(userDir, image)
        return rePath
    }
    public searchs = async (key: string, name: string, publish: boolean, code: string, page: number, limit: number, is_sell: number, product_type_name: string, product_type_id: number, brand_id: number, created_id: number, category_id: number, notify: string, is_authentic: boolean, is_freeship: boolean, can_return: boolean, seller_id: number, brand_origin: string, made_in: string, publish_yomart: number) => {
        let query = `
                    select p.id, 
                    p.code,
                    p.name,
                    p.weight,
                    p.price,
                    p.price_import,
                    p.price_wholesale,
                    p.price_sale,
                    p.min_inventory,
                    p.max_inventory,
                    p.publish_yomart,
                    p.description,
                    p.detail_info,
                    p.notify,
                    p.brand_origin,
                    p.made_in,
                    p.title,
                    p.meta_description,
                    p.created_at,
                    pu.name as unit_name, 
                    u.name as created_name, 
                    c.name as category_name, 
                    pt.id as product_type_id,  
                    pt.name as product_type_name, 
                    b.id as brand_id, 
                    b.name as brand_name, 
                    pc.commission as commission, 
                    sp.name as supplier_name, 
                    CONCAT(war.warranty_period, ' tháng') as warranty_period, 
                    war.warranty_place, war.warranty_form, 
                    war.warranty_instructions,
                    (select name as seller_name from seller where seller.id = p.seller_id) as seller_name,
                    wu.name as weight_name,
                    IFNULL((select count(id) from product where parent_id = p.id), 0) as child_count, 
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
                    IFNULL((
                    select sum(od.quantity) as sum from orders o 
                    LEFT JOIN order_detail od on o.id = od.order_id
                    WHERE (o.status <= 3 or o.status = 7) and od.product_id = p.id or od.product_id in (
						select id from product where parent_id = p.id
                    ) and od.seller_id = p.seller_id), 0) as available,

                    IFNULL((
                    select sum(w.quantity) from warehouse w 
                    WHERE w.product_id = p.id or w.product_id in (
						select id from product where parent_id = p.id
                    )
                    and w.branch_id = IFNULL(
                    (SELECT id from branch where seller_id = p.seller_id and online_selling = 1), 
                    (SELECT min(id) from branch where seller_id = p.seller_id))), 0) 
                    as inventory
                    from ${this.tableName} p  
                    left join warehouse w on w.product_id = p.id
                    left join product_type pt on p.product_type_id = pt.id
                    left join supplier sp on p.supplier_id = sp.id
                    left join product_category c on p.category_id = c.id
                    left join users u on p.created_id = u.id
                    left join product_unit pu on pu.id = p.unit_id
                    left join branch br on br.seller_id = p.seller_id
                    left join product_image pi on pi.product_id = p.id
                    left join weight_unit wu on wu.id = p.weight_id
                    left join warranty war on p.id = war.product_id 
                    left join brand b on p.brand_id = b.id left join product_commission pc on p.id = pc.product_id  where 1 = 1 and p.type = 'normal' `
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
        if (category_id != undefined) {
            const categories = await this.categoryService.getAllChildById(category_id)
            if (Array.isArray(categories) && categories.length > 0) {
                query += ` and p.category_id in (${categories})`
            }
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
        const result = await database.executeQuery(query) as RowDataPacket;
        console.log(result)
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result.map((item: any) => {
                console.log('a', item.detail_info, 'b', item.images)
                const detail_info = item.detail_info ? JSON.parse(item.detail_info) : []
                const list_image = item.images ? JSON.parse("[" + item.images + "]") : []
                return {
                    ...item,
                    images: list_image,
                    available: Number(item.inventory) - Number(item.available),
                    inventory: Number(item.inventory),
                    detail_info: detail_info.length > 0 ? detail_info
                        .sort((a: any, b: any) => a.sort - b.sort)
                        .map((item: any) => `${item.title}: ${item.value}`)
                        .join(', ') : "",
                    list_image: list_image.length > 0 ? list_image
                        .sort((a: any, b: any) => a.sort - b.sort)
                        .map((item: any) => `https://yowork.optech.vn:3007/uploads${item.image}`)
                        .join(', ') : "",
                }
            }),
            pagination: pagination
        }
    }
    public updatePublish = async (model: CreateDto, id: number) => {
        try {
            let result = null;
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]) as RowDataPacket;
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND, this.fieldId);
            const log: Ilog = {
                action: errorMessages.UPDATE_STATUS,
                user_id: model.created_id!,
                module_id: this.moduleId,
            }
            const publicId = getPublish[0].publish
            result = await database.executeQueryLog(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publicId == 0 ? 1 : 0, update_at, id], log);
            const childs = await database.executeQuery(`select id from ${this.tableName} where parent_id = ?`, [id]) as RowDataPacket
            if (childs.length > 0) {
                const childIds = childs.map((child: any) => child.id)
                const query = `update ${this.tableName} set publish = ${publicId == 0 ? 1 : 0}, updated_at = ? where id in (${childIds})`
                await database.executeQuery(query, [update_at]);
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public updatePublishYomart = async (listId: number[], publishId: number, created_id: number) => {
        try {
            const update_at = new Date()
            const log: Ilog = {
                action: errorMessages.UPDATE_STATUS,
                user_id: created_id,
                module_id: this.moduleId,
            }
            for (const element of listId) {
                console.log(element)
                const childs = await database.executeQuery(`select id from ${this.tableName} where parent_id = ?`, [element]) as RowDataPacket
                if (childs.length > 0) {
                    const childIds = childs.map((child: any) => child.id)
                    const query = `update ${this.tableName} set publish_yomart = ${publishId}, updated_at = ? where id in (${childIds})`
                    await database.executeQuery(query, [update_at]);
                }
                let result = null;
                result = await database.executeQuery(`update ${this.tableName} set publish_yomart = ?, updated_at = ? where id = ?`, [publishId, update_at, element]);
            }

        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (model: CreateDto, data: number[]) => {
        try {
            for (const item of data) {
                const check = await checkExist(this.tableName, 'id', item.toString());
                if (check == false)
                    return new HttpException(404, errorMessages.NOT_EXISTED, this.fieldId);
                const result = await this.delete(item, model);
            }
        } catch (error) {

        }
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS
            }
        }
    }
    private addToErrors = (info: IError, errors: IError[], STT: string, newMsg: string) => {
        const existingError = errors.find(err => err.STT == STT);
        if (existingError) {
            existingError.Msg += `, ${newMsg}`;
        } else {
            info.STT = STT;
            info.Msg = newMsg;
            errors.push({ ...info });
        }
    };
    public convertExcelDateToDate = (value: any): Date | null => {
        if (value instanceof Date)
            return value
        if (typeof value === 'string') {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date
        }
        if (typeof value === 'number') {
            const excelStartDate = new Date(1899, 11, 30);
            return new Date(excelStartDate.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
        }
        return null;
    }

    public formatDate = (date: Date): string => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const year = date.getFullYear()
        return `${year}-${month}-${day}`
    }
    public formatPrice = (price: string): number => {
        return parseFloat(price.replace(/,/g, ''))
    }
    public importExcelUpdate = async (file: any, created_id: number) => {
        const seller_id = await database.executeQuery('SELECT seller_id from users where id = ?', [created_id]) as RowDataPacket
        let info: IError = {
            STT: '',
            Msg: ''
        };
        if (!file) {
            return new HttpException(400, errorMessages.FILE_NOT_FOUND, 'file');
        }
        const workBook = xlsx.read(file.buffer, { type: 'buffer' })
        const sheetName = workBook.SheetNames[0];
        const sheet = workBook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { raw: false });
        const dataFiltered: any[] = [];
        let errors: IError[] = []
        let code = ''
        const rowCount = data.length
        const maxRows = 1000
        if (rowCount > maxRows)
            return new HttpException(400, errorMessages.MAX_ROW_EXCEL + ` ${maxRows} dòng.`);

        let results: any[] = [];
        try {
            
            for (const [i, value] of data.entries() as any) {
                let STT = i + 1;
                let name = value['Tên sản phẩm'] ? value['Tên sản phẩm'].toString() : '';
                let category_name = value['Danh mục sản phẩm'] ? value['Danh mục sản phẩm'].toString() : '';
                const category = (await database.executeQuery(`select id from product_category where name = ?`, [category_name]) as RowDataPacket).map((item: any) => item.id)
                if (name !== '') {
                    let product_unit_id, product_type_id, product_brand_id
                    if (value['Đơn vị']) {
                        const exist = await database.executeQuery(`SELECT id from product_unit where name = "${value['Đơn vị']}" and seller_id = ?`, [seller_id[0].seller_id]) as RowDataPacket
                        if (exist.length === 0) {
                            const model: productUnitDto = {
                                name: value['Đơn vị'],
                                publish: true,
                                created_id: created_id,
                                seller_id: seller_id[0].seller_id
                            }
                            const res = await this.productUnitService.create(model) as RowDataPacket
                            product_unit_id = res.data.id
                        }
                        else product_unit_id = exist[0].id
                    }
                    if (value['Loại sản phẩm']) {
                        const exist = await database.executeQuery(`SELECT id from product_type where name = "${value['Loại sản phẩm']}" and seller_id = ?`, [seller_id[0].seller_id]) as RowDataPacket
                        if (exist.length === 0) {
                            const model: productTypeDto = {
                                name: value['Loại sản phẩm'],
                                publish: true,
                                created_id: created_id,
                                seller_id: seller_id[0].seller_id
                            }
                            const res = await this.productTypeService.create(model) as RowDataPacket
                            product_type_id = res.data.id
                        }
                        else product_type_id = exist[0].id
                    }
                    if (value['Nhãn hiệu']) {
                        const exist = await database.executeQuery(`SELECT id from brand where name = "${value['Nhãn hiệu']}" and seller_id = ?`, [seller_id[0].seller_id]) as RowDataPacket
                        if (exist.length === 0) {
                            const model: brandDto = {
                                name: value['Nhãn hiệu'],
                                publish: true,
                                created_id: created_id,
                                seller_id: seller_id[0].seller_id
                            }
                            const res = await this.brandService.create(model) as RowDataPacket
                            product_brand_id = res.data.id
                        }
                        else product_brand_id = exist[0].id
                    }
                    code = value['Mã sản phẩm'] ? value['Mã sản phẩm'].toString() : '';
                    let description = value['Mô tả sản phẩm'] ? value['Mô tả sản phẩm'].toString() : '';
                    let weight = value['Khối lượng'] ? Number(value['Khối lượng']) : -1;
                    let weight_unit = value['Đơn vị khối lượng'] ? value['Đơn vị khối lượng'].toString() : '';
                    let price_excel = value['Giá bán lẻ'] ? value['Giá bán lẻ'].toString() : '';
                    let price_import_excel = value['Giá nhập'] ? value['Giá nhập'].toString() : '';
                    let price_wholesale_excel = value['Giá bán buôn'] ? value['Giá bán buôn'].toString() : '';
                    let price_sale_excel = value['Giá khuyến mãi'] ? value['Giá khuyến mãi'].toString() : '';
                    let price = this.formatPrice(price_excel)
                    let price_wholesale = this.formatPrice(price_wholesale_excel)
                    let price_import = this.formatPrice(price_import_excel)
                    let price_sale = this.formatPrice(price_sale_excel)
                    let max_inventory = value['Tồn kho tối đa'] ? value['Tồn kho tối đa'] : 0;
                    let min_inventory = value['Tồn kho tối thiểu'] ? value['Tồn kho tối thiểu'] : 0;
                    let publish_yomart = value['Hiển thị trên sàn Yomart'] ? value['Hiển thị trên sàn Yomart'].toString() : 'Không';
                    let detail_info = value['Thông tin chi tiết'] ? value['Thông tin chi tiết'].toString() : '';
                    let notify = value['Thông báo'] ? value['Thông báo'].toString() : '';
                    let brand_origin = value['Xuất xứ thương hiệu'] ? value['Xuất xứ thương hiệu'].toString() : '';
                    let made_in = value['Xuất xứ (Made in)'] ? value['Xuất xứ (Made in)'].toString() : '';
                    let title = value['Title'] ? value['Title'].toString() : '';
                    let meta_description = value['Meta Description'] ? value['Meta Description'].toString() : '';
                    let warranty_period = value['Thời gian bảo hành'] ? value['Thời gian bảo hành'].toString() : '';
                    let warranty_form = value['Hình thức bảo hành'] ? value['Hình thức bảo hành'].toString() : '';
                    let warranty_place = value['Nơi bảo hành'] ? value['Nơi bảo hành'].toString() : '';
                    let warranty_instructions = value['Hướng dẫn bảo hành'] ? value['Hướng dẫn bảo hành'].toString() : '';
                    let list_image = value['Ảnh sản phẩm'] ? value['Ảnh sản phẩm'].toString() : '';
                    const category_id = category[0]
                    const leafnode = (await this.productCategoryService.getLeafNode(seller_id[0].seller_id)).data
                    let errorCount = 0
                    if (category.length === 0 || category.length > 1 || leafnode.length < 1 || !leafnode.includes(category_name)) {
                        this.addToErrors(info, errors, STT, 'Danh mục sản phẩm không hợp lệ');
                        errorCount++
                    }

                    if (price_excel === '') {
                        this.addToErrors(info, errors, STT, 'Giá bán lẻ không hợp lệ');
                        errorCount++
                    }
                    if (price_wholesale_excel === '') {
                        this.addToErrors(info, errors, STT, 'Giá bán buôn không hợp lệ');
                        errorCount++
                    }
                    if (price_sale_excel === '' || price_sale_excel >= price_excel) {
                        this.addToErrors(info, errors, STT, 'Giá khuyến mãi không hợp lệ');
                        errorCount++
                    }
                    if (price_import_excel === '' || price_import_excel >= price_wholesale_excel || price_import_excel >= price_excel) {
                        this.addToErrors(info, errors, STT, 'Giá nhập không hợp lệ');
                        errorCount++
                    }
                    if (weight < 0) {
                        this.addToErrors(info, errors, STT, 'Khối lượng không hợp lệ');
                        errorCount++
                    }
                    if (max_inventory === 0 || min_inventory === 0 || max_inventory < min_inventory) {
                        this.addToErrors(info, errors, STT, 'Giá trị tồn kho không hợp lệ');
                        errorCount++
                    }
                    if (weight_unit !== 'kg' && weight_unit !== 'g') {
                        this.addToErrors(info, errors, STT, 'Đơn vị khối lượng không hợp lệ');
                        errorCount++
                    }
                    if (publish_yomart !== 'Có' && publish_yomart !== 'Không') {
                        this.addToErrors(info, errors, STT, 'Hiển thị trên sàn Yomart không hợp lệ');
                        errorCount++
                    }

                    if (code !== '') {
                        const checkCodeExistAll = await database.executeQuery(`select id from product where code = ?`, [code]) as RowDataPacket
                        const checkCodeExist = await database.executeQuery(`select id from product where code = ? and seller_id = ?`, [code, seller_id[0].seller_id]) as RowDataPacket
                        if (checkCodeExist.length === 0 && checkCodeExistAll.length > 0) {
                            this.addToErrors(info, errors, STT, errorMessages.CODE_EXISTED);
                        }
                        else {
                            dataFiltered.push({
                                STT, code, name, category_id, product_brand_id, weight, weight_unit, product_unit_id, price, price_wholesale, price_import, price_sale, max_inventory, min_inventory, publish_yomart, description, detail_info, notify, brand_origin, warranty_period, warranty_form, warranty_place, warranty_instructions, title, meta_description, made_in, product_type_id, list_image,
                            });
                        }
                        errorCount++
                    }
                    if (errorCount === 0) {
                        dataFiltered.push({
                            STT, code, name, product_type_id, description, product_brand_id, weight, product_unit_id, price, price_wholesale, price_import, price_sale, max_inventory, min_inventory, weight_unit, publish_yomart, detail_info, notify, brand_origin, made_in, title, meta_description, warranty_period, warranty_form, warranty_place, warranty_instructions, list_image, category_id
                        });
                    }
                }
                else {
                    if (name === '') {
                        this.addToErrors(info, errors, STT, errorMessages.NAME_REQUIRED);
                    }
                }
            }
            for (const item of dataFiltered) {
                const checkCodeExist = await database.executeQuery(`select id from product where code = ? and seller_id = ?`, [code, seller_id[0].seller_id]) as RowDataPacket
                let data = []
                let list_image = []
                if (item.detail_info) {
                    data = item.detail_info.split(', ').map((item: any, index: any) => {
                        const [title, ...rest] = item.split(': ');
                        return {
                            title: title.trim(),
                            value: rest.join(': ').trim(),
                            sort: index + 1
                        };
                    });
                }
                if (item.list_image) {
                    list_image = item.list_image.split(', ').map((item: any) => item.trim());
                }
                try {
                    const value = {
                        name: item.name,
                        category_id: item.category_id || null,
                        brand_id: item.product_brand_id || null,
                        weight: item.weight,
                        weight_unit: item.weight_unit,
                        unit_id: item.product_unit_id || null,
                        price: item.price || 0,
                        price_wholesale: item.price_wholesale || 0,
                        price_import: item.price_import || 0,
                        price_sale: item.price_sale || 0,
                        min_inventory: item.min_inventory,
                        max_inventory: item.max_inventory,
                        publish_yomart: item.publish_yomart === 'Có' ? 1 : 0,
                        description: item.description || null,
                        detail_info: JSON.stringify(data),
                        notify: item.notify || null,
                        brand_origin: item.brand_origin || null,
                        warranty_period: item.warranty_period && parseInt(item.warranty_period.match(/\d+/)?.[0] || '0', 10),
                        warranty_form: item.warranty_form || null,
                        warranty_place: item.warranty_place || null,
                        warranty_instructions: item.warranty_instructions || null,
                        title: item.title || null,
                        meta_description: item.meta_description || null,
                        made_in: item.made_in || null,

                        publish: 1,
                        product_type_id: item.product_type_id || null,
                        created_id,
                        seller_id: seller_id[0].seller_id,
                    }
                    if (item.code === '' || checkCodeExist.length === 0) {
                        const model = {
                            code: item.code || await generateCodeWithSeller(this.tableName, 'SP', 8, seller_id[0].seller_id as number) as string,
                            ...value
                        };
                        const create = await this.createProductJSON(model, []);
                        if (!(create instanceof HttpException) && create?.data) {
                            results.push(create.data);
                            if (list_image.length > 0) {
                                for (const link of list_image) {
                                    try {
                                        const response = await axios.get(link, { responseType: 'arraybuffer' });
                                        const buffer = Buffer.from(response.data);

                                        const contentType = response.headers['content-type'];
                                        const ext = contentType.split('/')[1];

                                        const nameImage = this.removeVietnameseAccents(create.data.name)
                                            .replace(/\s+/g, '_')
                                            .toLowerCase();
                                        const fileName = `${nameImage}_${list_image.indexOf(link) + 1}.${ext}`;

                                        const userDir = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string, create.data.code);
                                        const thumbnailDir = path.join(userDir, 'thumbnail');

                                        if (!fs.existsSync(userDir)) {
                                            fs.mkdirSync(userDir, { recursive: true });
                                        }
                                        if (!fs.existsSync(thumbnailDir)) {
                                            fs.mkdirSync(thumbnailDir);
                                        }

                                        await fs.promises.writeFile(
                                            path.join(userDir, fileName),
                                            buffer
                                        );

                                        await sharp(buffer)
                                            .resize(350, 350)
                                            .toFile(path.join(thumbnailDir, fileName));
                                        await database.executeQuery(`insert into product_image (product_id, image, created_id, seller_id) values (?, ?, ?, ?)`, [create.data.id, fileName, created_id, seller_id[0].seller_id])
                                    } catch (error) {
                                        console.error('Error downloading image:', error);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        const model = {
                            code: item.code,
                            ...value
                        }
                        const id = await database.executeQuery(`select id, name, code from product where code = ? and seller_id = ?`, [item.code, seller_id[0].seller_id]) as RowDataPacket
                        const update = await this.updateProduct(model, id[0].id, []);
                        if (!(update instanceof HttpException) && update?.data) {
                            results.push(update.data);
                            if (list_image.length > 0) {
                                const product_images = await database.executeQuery(`select id from product_image where product_id = ?`, [update.data.id]) as RowDataPacket[]
                                if (product_images.length > 0) {
                                    for (const image of product_images) {
                                        await this.deleteOneProductImage(image.id)
                                    }
                                }
                                for (const link of list_image) {
                                    try {
                                        const response = await axios.get(link, { responseType: 'arraybuffer' });
                                        const buffer = Buffer.from(response.data);

                                        const contentType = response.headers['content-type'];
                                        const ext = contentType.split('/')[1];

                                        const nameImage = this.removeVietnameseAccents(id[0].name)
                                            .replace(/\s+/g, '_')
                                            .toLowerCase();
                                        const fileName = `${nameImage}_${list_image.indexOf(link) + 1}.${ext}`;

                                        const userDir = path.join(__dirname, process.env.PRODUCT_UPLOAD_IMAGE_PATH as string, id[0].code);
                                        const thumbnailDir = path.join(userDir, 'thumbnail');

                                        if (!fs.existsSync(userDir)) {
                                            fs.mkdirSync(userDir, { recursive: true });
                                        }
                                        if (!fs.existsSync(thumbnailDir)) {
                                            fs.mkdirSync(thumbnailDir);
                                        }

                                        await fs.promises.writeFile(
                                            path.join(userDir, fileName),
                                            buffer
                                        );

                                        await sharp(buffer)
                                            .resize(350, 350)
                                            .toFile(path.join(thumbnailDir, fileName));
                                        await database.executeQuery(`insert into product_image (product_id, image, created_id, seller_id) values (?, ?, ?, ?)`, [id[0].id, fileName, created_id, seller_id[0].seller_id])
                                    } catch (error) {
                                        console.error('Error downloading image:', error);
                                    }
                                }
                            }
                        }
                    }

                } catch (error) {
                    this.addToErrors(info, errors, item.STT, errorMessages.CREATE_FAILED);
                }
            }
            return {
                message: `Tổng số dòng: ${dataFiltered.length + errors.length}, Số dòng thêm thành công: ${results.length}, Số dòng thất bại: ${errors.length}`,
                total: dataFiltered.length + errors.length,
                successTotal: results.length,
                failedTotal: errors.length,
                results: results,
                errors: errors
            }
        } catch (error) { }
    }
    public convertIsSellToIsSellName = (is_sell: number) => {
        if (is_sell == 1) return errorMessages.ALLOW_SELL;
        return errorMessages.NOT_ALLOW_SELL;
    }
    public updateListPublish = async (data: number[], publish: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set publish = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [publish, update_at]);
            for (const element of data) {
                console.log(element)
                const childs = await database.executeQuery(`select id from ${this.tableName} where parent_id = ?`, [element]) as RowDataPacket
                if (childs.length > 0) {
                    const childIds = childs.map((child: any) => child.id)
                    const query = `update ${this.tableName} set publish = ${publish}, updated_at = ? where id in (${childIds})`
                    await database.executeQuery(query, [update_at]);
                }
            }

        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public updateListPublishYomart = async (data: number[], publish: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set publish_yomart = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [publish, update_at]);
            return {
                data: {
                    publish: publish,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }


    public getAvailableProduct = async (key: string, seller_id: number, user_id: number, pageInput?: number, limitInput?: number) => {
        let branch_id: number[] = [];
        const user_branches = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket;
        const user_branch_ids = user_branches.map((branch: any) => branch.branch_id);
        if (user_branches.length > 0 && !user_branch_ids.includes(0)) {
            branch_id = user_branch_ids;
        }
        let query = `
            SELECT p.*, pu.name AS unit_name, u.name AS created_name, c.name AS category_name, pt.id AS product_type_id, pt.name AS product_type_name, b.id AS brand_id, b.name AS brand_name, pc.commission AS commission, sp.name AS supplier_name,
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
                COALESCE(
                    (SELECT SUM(w.quantity)
                    FROM warehouse w 
                    WHERE p.id = w.product_id 
                    ${branch_id && branch_id.length > 0 ? `AND w.branch_id IN (${branch_id})` : ''}
                ), 0) AS inventory

            FROM product p  
            LEFT JOIN product_unit pu ON pu.id = p.unit_id
            LEFT JOIN warehouse w ON w.product_id = p.id
            LEFT JOIN branch br ON w.branch_id = br.id
            LEFT JOIN product_type pt ON p.product_type_id = pt.id
            LEFT JOIN supplier sp ON p.supplier_id = sp.id
            LEFT JOIN product_category c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_id = u.id
            LEFT JOIN brand b ON p.brand_id = b.id 
            LEFT JOIN product_commission pc ON p.id = pc.product_id
            LEFT JOIN product child ON child.parent_id = p.id
            LEFT JOIN product_image pi ON pi.product_id = p.id 
                AND pi.id = (SELECT MIN(id) FROM product_image WHERE product_image.product_id = p.id)

            WHERE p.seller_id = ? AND p.type = 'normal' AND (p.parent_id != 0 OR child.id IS NULL)  ${key !== undefined ? ` and p.name like '%${key}%' ` : ` `}
            GROUP BY p.id, p.seller_id 
            ORDER BY p.id DESC
        `
        const count = await database.executeQuery(query, [seller_id]) as RowDataPacket
        if (limitInput && pageInput) {
            query += ` LIMIT ${limitInput} OFFSET ${(pageInput - 1) * limitInput}`
        }

        const result = await database.executeQuery(query, [seller_id]) as RowDataPacket[]
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        let pagination: IPagiantion = {
            page: 1 * (pageInput || 0),
            limit: 1 * (limitInput || 0),
            totalPage: limitInput ? Math.ceil(count.length / limitInput) : null
        }
        for (const item of result) {
            item.available = (await this.warehouseService.getAvailableQuantity(item.id, branch_id, seller_id)).data * 1
        }
        return {
            data: result.map((item: any) => { return { ...item, images: item.images ? JSON.parse('[' + item.images + ']') : [] } }).filter((item: any) => item.available > 0),
            pagination: pagination
        }

    }

    public getProductWarehouseInfo = async (id: number, user_id: number, seller_id: number) => {
        let branch_id: number[] = [];
        const user_branches = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket;
        const user_branch_ids = user_branches.map((branch: any) => branch.branch_id);
        if (user_branches.length > 0 && !user_branch_ids.includes(0)) {
            branch_id = user_branch_ids;
        }
        const exist = await checkExist('product', 'id', id)
        if (exist === false) {
            return new HttpException(404, errorMessages.NOT_EXISTED, 'product')
        }
        const query = `
            SELECT 
                b.name AS branch_name,
                w.quantity,
                p.price_import,
                b.online_selling,
                p.max_inventory,
                p.min_inventory,
                (
                    SELECT COALESCE(SUM(od.quantity), 0)
                    FROM orders o 
                    LEFT JOIN order_detail od ON o.id = od.order_id
                    WHERE (o.status <= 3 or o.status = 7) 
                    AND od.product_id = w.product_id   
                    AND o.branch_id = w.branch_id
                    AND o.seller_id = w.seller_id
                ) AS on_trading,
                COALESCE((
                    SELECT SUM(dnd.qty) 
                    FROM delivery_note dn 
                    LEFT JOIN delivery_note_detail dnd ON dn.id = dnd.delivery_note_id
                    WHERE dn.status = "da_xuat_kho" 
                    AND dnd.product_id = w.product_id 
                    AND dn.from_branch = w.branch_id
                    AND dn.seller_id = w.seller_id
                ), 0) AS on_shipping,
                COALESCE((
                    SELECT SUM(pod.quantity)
                    FROM purchase_order_detail pod
                    LEFT JOIN purchase_order po ON po.id = pod.order_id
                    WHERE pod.product_id = w.product_id 
                    AND po.status = 'tao_moi' 
                    AND po.branch_id = w.branch_id
                    AND po.seller_id = w.seller_id
                ), 0) AS on_import
            FROM warehouse w
            LEFT JOIN branch b ON w.branch_id = b.id
            LEFT JOIN product p ON w.product_id = p.id
            WHERE w.product_id = ?;
        `
        const result = await database.executeQuery(query, [id]) as RowDataPacket[]
        for (const item of result) {
            item.available = item.quantity - item.on_trading
        }
        return {
            data: result.map((item: any) => {
                return {
                    ...item,
                    price_import: Number(item.price_import),
                    available: Number(item.available),
                    on_trading: Number(item.on_trading),
                    on_shipping: Number(item.on_shipping),
                    on_import: Number(item.on_import)
                }
            })
        }
    }

    public getProductWarehouseHistory = async (id: number) => {
        const exist = await checkExist('product', 'id', id)
        if (exist === false) {
            return new HttpException(404, errorMessages.NOT_EXISTED, 'product')
        }
        const query = `
            SELECT 
                created_at,
                staff,
                action_des,
                action,
                quantity,
                inventory,
                branch_name,
                order_code
            FROM (
                SELECT 
                    posh.created_at, 
                    u.name AS staff, 
                    CASE 
                        WHEN posh.status = 'khoi_tao_san_pham' THEN 'Nhập kho đầu kỳ'
                        WHEN posh.status = 'hoan_thanh' THEN 'Nhập hàng vào kho'
                    END as action_des,
                    posh.status AS action,
                    pod.quantity,
                    pod.inventory,
                    b.name AS branch_name, 
                    po.code AS order_code
                FROM purchase_order_status_history posh
                LEFT JOIN purchase_order po ON posh.order_id = po.id
                LEFT JOIN purchase_order_detail pod ON pod.order_id = po.id
                LEFT JOIN users u ON posh.user_id = u.id
                LEFT JOIN branch b ON b.id = po.branch_id
                WHERE pod.product_id = ?
                AND posh.status IN ('hoan_thanh', 'khoi_tao_san_pham')

                UNION ALL

                SELECT
                    MAX(dnd.created_at) AS created_at,
                    MAX(u.name) AS staff,
                    CASE 
                        WHEN dn.type = 'xuat_kho_ban_le' THEN 'Xuất kho bán lẻ'
                        WHEN dn.type = 'xuat_kho_trong_ky' THEN 'Xuất kho trong kỳ'
                        WHEN dn.type = 'xuat_kho_chuyen' THEN 'Xuất kho chuyển'
                    END AS action_des,
                    'xuat_kho' AS action,
                    SUM(dnd.qty) AS quantity,
                    MIN(dnd.inventory) AS inventory,
                    MAX(b.name) AS branch_name,
                    dn.code AS order_code
                FROM delivery_note_detail dnd
                LEFT JOIN users u ON dnd.created_id = u.id
                LEFT JOIN delivery_note dn ON dn.id = dnd.delivery_note_id
                LEFT JOIN branch b ON b.id = dn.from_branch
                WHERE dnd.product_id = ? AND dn.status = 'hoan_thanh'
                GROUP BY dn.code
            ) combined_results
            ORDER BY created_at ASC
        `
        console.log(query)
        let result = await database.executeQuery(query, [id, id]) as RowDataPacket
        const find = result.filter((item: any) => item.action === 'khoi_tao_san_pham').map((item: any, index: number) => index)
        console.log('find', find)
        const removeObjectsAfterKhoiTao = (arr: RowDataPacket, indexes: number[]) => {
            for (const index of indexes) {
                if (index + 1 < arr.length) {
                    arr.splice(index + 1, 1);
                }
            }
            return arr;
        }
        if (find.length > 0) {
            result = removeObjectsAfterKhoiTao(result, find);
        }
        console.log(result)
        return {
            data: result.reverse()
        }
    }

    public getProductsHaveNoBeginningInventory = async (search: string, seller_id: number, user_id: number, pageInput?: number, limitInput?: number) => {
        //console.log(search)
        let branches: number[] = []
        const branch_id = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket
        if (branch_id.length > 0 && !branch_id.map((item: any) => item.branch_id).includes(0)) {
            branches = branch_id.map((item: any) => item.branch_id)
        }
        console.log(branches)
        let query = `
            	SELECT 
                p.*, 
                pu.name AS unit_name,
                IFNULL(GROUP_CONCAT(
                    DISTINCT CASE 
                        WHEN pi.id IS NOT NULL 
                        THEN JSON_OBJECT(
                            'id', pi.id,
                            'image', CONCAT('/products/',
                                COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/', pi.image),
                            'image_thumbnail', CONCAT('/products/',       
                                COALESCE((SELECT code FROM product WHERE id = p.parent_id), p.code), '/thumbnail/', pi.image)) 
                        ELSE NULL 
                    END
                    ORDER BY pi.id ASC SEPARATOR ','
                ), '') AS images,
                u.name AS created_name, 
                c.name AS category_name, 
                pt.id AS product_type_id,  
                pt.name AS product_type_name, 
                b.id AS brand_id, 
                b.name AS brand_name, 
                pc.commission, 
                sp.name AS supplier_name,
                COALESCE(
                    (
                        SELECT SUM(w.quantity)
                        FROM warehouse w 
                        WHERE p.id = w.product_id 
                        ${branches.length > 0 ? ` AND w.branch_id IN (${branches})` : ` `}
                    ), 
                    0
                ) AS inventory
                FROM product p  
                LEFT JOIN warehouse w ON w.product_id = p.id
                LEFT JOIN product_type pt ON p.product_type_id = pt.id
                LEFT JOIN supplier sp ON p.supplier_id = sp.id
                LEFT JOIN product_category c ON p.category_id = c.id
                LEFT JOIN users u ON p.created_id = u.id
                LEFT JOIN brand b ON p.brand_id = b.id 
                LEFT JOIN product_commission pc ON p.id = pc.product_id 
                LEFT JOIN product_unit pu ON pu.id = p.unit_id 
                LEFT JOIN product_image pi ON pi.product_id = p.id        
                    AND pi.id = (SELECT MIN(id) FROM product_image WHERE product_image.product_id = p.id)
                WHERE
                p.seller_id = ? AND p.type = 'normal' ${search !== undefined ? ` AND p.name LIKE '%${search}%'` : ` `}
                AND p.id NOT IN (
                    SELECT p.id FROM product p
                    LEFT JOIN purchase_order_detail pod ON pod.product_id = p.id
                    LEFT JOIN purchase_order_status_history posh ON pod.order_id = posh.order_id
                    LEFT JOIN purchase_order po ON po.id = pod.order_id 
                    WHERE (posh.status = 'khoi_tao_san_pham' OR posh.status = 'da_nhap_kho')
                    ${branches.length > 0 ? ` AND posh.branch_id IN (${branches})` : ` `}
                    GROUP BY p.id
                )
                AND p.id NOT IN (
                    SELECT product_parent_id FROM product_attributes
                )
                GROUP BY p.id, p.seller_id 
                ORDER BY p.id DESC
        `
        const count = await database.executeQuery(query, [seller_id]) as RowDataPacket
        if (pageInput && limitInput) {
            query += ` LIMIT ${limitInput} OFFSET ${(pageInput - 1) * limitInput}`
        }

        const result = await database.executeQuery(query, [seller_id]) as RowDataPacket[]
        for (const item of result) {
            item.available = (await this.warehouseService.getAvailableQuantity(item.id, branches, seller_id)).data * 1
        }

        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        let pagination: IPagiantion = {
            page: pageInput,
            limit: limitInput,
            totalPage: limitInput ? Math.ceil(count.length / limitInput) : null
        }
        return {
            data: result.map((item: any) => { return { ...item, images: item.images ? JSON.parse('[' + item.images + ']') : [] } }),
            pagination: pagination
        }
    }

    public deleteOneProductImage = async (id: number) => {
        const query = `select image, product_id from product_image where id = ${id}`
        const image = await database.executeQuery(query) as RowDataPacket
        if (image.length < 1) {
            return new HttpException(400, errorMessages.NOT_FOUND, 'image')
        }
        const deleteQuery = `select pi.id as id from product_image pi
                left join product p on p.id = pi.product_id
                where pi.image = ? and (pi.product_id = ? or p.parent_id = ?)`
        const results = await database.executeQuery(deleteQuery, [image[0].image, image[0].product_id, image[0].product_id]) as RowDataPacket
        //console.log(results.map((i: any) => i.id), image, id)
        for (const element of results.map((i: any) => i.id)) {
            const data = await this.productImageService.delete(element)
        }
    }

    public deleteAllImage = async (product_id: number) => {
        //console.log(product_id)
        const imageId = await database.executeQuery(`select id from product_image where product_id = ${product_id}`) as RowDataPacket
        if (imageId.length > 0) {
            const ids = imageId.map((i: any) => i.id)
            const query = `select image, product_id from product_image where id in (${ids})`
            //console.log(query)
            const image = await database.executeQuery(query) as RowDataPacket
            if (image.length < 1) {
                return new HttpException(400, errorMessages.NOT_FOUND, 'image')
            }
            const imgs = image.map((i: any) => `'${i.image}'`).join(", ");
            const ps = image.map((i: any) => i.product_id)
            const deleteQuery = `select pi.id as id from product_image pi
            left join product p on p.id = pi.product_id
            where pi.image in (${imgs}) and (pi.product_id  in (${ps}) or p.parent_id in (${ps}))`
            const results = await database.executeQuery(deleteQuery) as RowDataPacket
            for (const element of results.map((i: any) => i.id)) {
                const data = await this.productImageService.delete(element)
            }
        }
    }
    public updateProductImage = async (productId: number, files: any, createdId: number | undefined) => {
        //console.log(files)
        try {
            if (!files || files.files.length === 0) {
                return new HttpException(400, errorMessages.MISSING_IMAGE);
            }
            let imageNames;
            let code: string;
            const query = `SELECT name, code FROM product WHERE id = ?`;
            const result = await database.executeQuery(query, [productId]) as RowDataPacket

            let returnImage = []

            if (result.length > 0) {
                const data = await database.executeQuery(`
                        SELECT image 
                        FROM product_image 
                        WHERE product_id = ${productId} 
                        ORDER BY id DESC 
                        LIMIT 1;
                    `) as RowDataPacket
                const getNumberBeforeDot = (filename: string): number | undefined => {
                    const match = filename.match(/_(\d+)\./);
                    return match ? parseInt(match[1], 10) : undefined;
                };
                let num
                if (data.length > 0) {
                    num = getNumberBeforeDot(data[0].image)
                }
                imageNames = this.convertToImageName(result[0].name, files.files, num || undefined);

                code = result[0].code;
                const uploadedImages = await this.awaitUploadImage(code, files.files, imageNames);
                for (let i = 0; i < uploadedImages.length; i++) {
                    let newProductImage: ProductImage = {
                        product_id: productId,
                        image: uploadedImages[i],
                        created_id: createdId,
                        publish: 1,
                    };
                    const image = await this.productImageService.create(newProductImage) as any
                    const imagePath = this.convertPathOfImage(uploadedImages[i], code)
                    const imageThumbnail = this.convertPathOfImage(uploadedImages[i], code, 'thumbnail');
                    returnImage.push({
                        image: imagePath,
                        image_thumbnail: imageThumbnail,
                        id: image.data.id,
                        product_id: image.data.product_id
                    })
                }
                return {
                    images: returnImage
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    };

    public createNewAttributes = async (id: number, attributes: { name: string, values: any, product_attributes_id?: number }[]) => {
        //console.log(id, attributes)
        try {
            for (const element of attributes) {
                if (element.product_attributes_id) {
                    await this.updateAttribute(element.product_attributes_id, element.name)
                }
                else {
                    const model: AttributeDetailDto = {
                        name: element.name,
                        product_parent_id: id,
                        values: element.values
                    }
                    const result = await this.productAttributeService.create(model)
                    if (result instanceof HttpException) {
                        return new HttpException(400, errorMessages.CREATE_FAILED, element.name);
                    }
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    }

    public updateAttribute = async (id: number, name: string) => {
        try {
            const update = await database.executeQuery(`update product_attributes set name = "${name}" where id = ${id}`) as RowDataPacket
            if (update.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public deleteAttribute = async (id: number) => {
        //console.log(id)
        try {
            const query = `
                select count(distinct pa.id) as total_attributes, count(distinct pad.id) as total_attribute_detail from product_attributes pa
                left join product_attribute_detail pad on pad.attribute_id = pa.id
                where pa.product_parent_id = ( SELECT distinct p.parent_id FROM product p
                WHERE p.parent_id = (
                SELECT DISTINCT pa.product_parent_id
                FROM product_attributes pa
                JOIN product_attribute_detail pad ON pad.attribute_id = pa.id
                WHERE pa.id = ${id}))
            `
            const data = await database.executeQuery(query) as RowDataPacket
            //console.log(data)
            if (data.length < 0) {
                return new HttpException(400, errorMessages.NOT_EXISTED, 'attribute_id')
            }
            if (data[0].total_attributes === 1) {
                return new HttpException(400, "Phiên bản phải có ít nhất 1 thuộc tính")
            }
            const listDetailId = await database.executeQuery(`
                select pad.id from product_attribute_detail pad 
                left join product_attributes pa on pa.id = pad.attribute_id
                where pa.id = ${id}  
            `) as RowDataPacket
            if (listDetailId.length > 0) {
                for (const element of listDetailId.map((item: any) => item.id)) {
                    const result = await this.productAttributeDetailService.delete(element)
                    if (result instanceof HttpException) {
                        return new HttpException(400, errorMessages.DELETE_FAILED, element);
                    }
                }
            }
            else {
                //console.log('a')
                const deleteAtt = await database.executeQuery(`
                delete from ${this.tableName} 
                where id = ${id}  
            `) as RowDataPacket
                if (deleteAtt.affectedRows === 0) {
                    return new HttpException(400, errorMessages.DELETE_FAILED)
                }
            }

            return {
                data: id
            }

        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }

    public deleteAttributeDetail = async (id: number, attribute_detail: string) => {
        const attDetail_id = await database.executeQuery(`
                select id from product_attribute_detail where attribute_id = ${id} and value = '${attribute_detail}'
            `) as RowDataPacket
        if (attDetail_id.length > 0) {
            const checkCanDelete = await database.executeQuery(
                `
                        SELECT id, attributes
                        FROM product
                        WHERE (attributes LIKE '${attDetail_id[0].id}-%'   
                        OR attributes LIKE '%-${attDetail_id[0].id}-%'
                        OR attributes LIKE '%-${attDetail_id[0].id}'   
                        OR attributes = '${attDetail_id[0].id}')       
                        AND parent_id = (select product_parent_id from product_attributes where id = ${id})
                    `
            ) as RowDataPacket
            const getSubQuantity = await database.executeQuery(`
                    select id from product p
                    where p.parent_id = (select product_parent_id from product_attributes where id = ${id})
                `) as RowDataPacket

            if (checkCanDelete.length === 1 && getSubQuantity.length === 1) {
                if (checkCanDelete[0].attributes.split('-').length === 1) {
                    return new HttpException(400, "Phiên bản phải có ít nhất 1 thuộc tính")
                }

            }
        }
        const getId = await database.executeQuery(`
            select pad.id from product_attribute_detail pad
            left join product_attributes pa on pa.id = pad.attribute_id
            where pa.id = ${id} and pad.value = '${attribute_detail}'
        `) as RowDataPacket
        if (getId.length < 1) {
            return new HttpException(400, errorMessages.NOT_EXISTED, 'attribute_id')
        }
        const result = await this.productAttributeDetailService.delete(getId[0].id)
        if (result instanceof HttpException)
            return new HttpException(404, errorMessages.DELETE_FAILED);
    }

    public updateSubProductImage = async (image: string, id: number, created_id: number) => {
        let data
        data = image.split('\\')
        if (data.length === 1) {
            data = data[0].split('/')
        }
        const query = `select id from product_image where product_id = ${id}`
        const image_id = await database.executeQuery(query) as RowDataPacket
        if (image_id.length > 0) {
            const model: ProductImage = {
                product_id: id,
                image: data[data.length - 1]
            }
            const result = await this.productImageService.update(model, image_id[0].id)
            if (result instanceof HttpException)
                return new HttpException(404, errorMessages.UPDATE_FAILED);

        }
        else {
            const model: ProductImage = {
                product_id: id,
                image: data[data.length - 1],
                publish: 1,
                created_id
            }
            const result = await this.productImageService.create(model)
            if (result instanceof HttpException)
                return new HttpException(404, errorMessages.UPDATE_FAILED);
        }
    }

    public updateSubProduct = async (model: CreateDto, id: number) => {

        if (id) {
            const exist = await checkExist(this.tableName, 'id', id)
            if (exist === false) {
                return new HttpException(404, errorMessages.NOT_FOUND, 'product');
            }
            if (model.sub_product_attributes && model.sub_product_attributes.length > 0) {
                const attsId = model.sub_product_attributes.map((att: any) => att.product_attributes_id)
                const values = model.sub_product_attributes.map((att: any) => `"${att.attribute_detail_value}"`)
                const data = await database.executeQuery(
                    `select value from product_attribute_detail where attribute_id in (${attsId}) and value in (${values})`
                ) as RowDataPacket
                let existValue = []
                if (data.length > 0) {
                    existValue = data.map((value: any) => value.value)
                }
                const product_att = await database.executeQuery(`
                    select pa.id as product_attributes_id, pad.id as product_attribute_detail_id, pad.value from product p
                    left join product_attributes pa on pa.product_parent_id = p.id
                    left join product_attribute_detail pad on pad.attribute_id = pa.id
                    where p.id = (select parent_id from product where id = ${id})    
                `) as RowDataPacket[]
                if (product_att.length > 0) {
                    for (const element of model.sub_product_attributes) {
                        const exist = product_att.filter((att: any) => att.product_attributes_id === element.product_attributes_id && element.attribute_detail_value === att.value)
                        const oldData = product_att.filter((att: any) => att.product_attributes_id === element.product_attributes_id && att.product_attribute_detail_id === element.product_attribute_detail_id)
                        if (exist.length < 1) {
                            const query = `
                                    SELECT * 
                                    FROM product 
                                    WHERE attributes REGEXP '(^|-)${oldData[0].product_attribute_detail_id}(-|$)';
                                `
                            const checkCanDelete = await database.executeQuery(
                                query
                            ) as RowDataPacket
                            if (checkCanDelete.length === 1) {
                                const query = `UPDATE product_attribute_detail SET value = '${element.attribute_detail_value}' WHERE id = ${oldData[0].product_attribute_detail_id} and value = '${oldData[0].value}'`
                                await database.executeQuery(query)
                            }
                            else {
                                const query = `INSERT INTO product_attribute_detail (attribute_id, value) VALUES (${oldData[0].product_attributes_id}, '${element.attribute_detail_value}');`
                                await database.executeQuery(query)
                            }
                        }
                    }
                }

                let attributes = []
                for (const element of model.sub_product_attributes.sort((x, y) => x.product_attributes_id - y.product_attributes_id)) {
                    const query = `select id from product_attribute_detail where attribute_id = ? and value = ?`
                    const data = await database.executeQuery(query, [element.product_attributes_id, element.attribute_detail_value]) as RowDataPacket
                    //console.log(data)
                    if (data.length > 0) {
                        attributes.push(data[0].id)
                    }
                }
                model.product_attribute = attributes.join("-")
                console.log(model)
                const result = await this.updateProduct(model, id, undefined)
                if (result instanceof HttpException) {
                    return new HttpException(400, errorMessages.UPDATE_FAILED, 'product');
                }

            }
        }
        else return new HttpException(400, errorMessages.MISSING_DATA, 'product_id');
    }

    public createSubProduct = async (model: CreateDto, image?: string) => {
        if (model.sub_product_attributes && model.sub_product_attributes.length > 0) {
            const attsId = model.sub_product_attributes.sort((x, y) => x.product_attributes_id - y.product_attributes_id).map((att: any) => att.product_attributes_id)
            const values = model.sub_product_attributes.sort((x, y) => x.product_attributes_id - y.product_attributes_id).map((att: any) => `"${att.attribute_detail_value}"`)
            const names = model.sub_product_attributes.sort((x, y) => x.product_attributes_id - y.product_attributes_id).map((att: any) => `${att.attribute_detail_value}`)
            const data = await database.executeQuery(
                `select value from product_attribute_detail where attribute_id in (${attsId}) and value in (${values})`
            ) as RowDataPacket
            let existValue = []
            if (data.length > 0) {
                existValue = data.map((value: any) => value.value)
            }
            for (const element of model.sub_product_attributes.filter(item => !data.includes(item.attribute_detail_value))) {
                //console.log(element.product_attributes_id, element.attribute_detail_value)
                await database.executeQuery(
                    `INSERT INTO product_attribute_detail (attribute_id, value) VALUES (${element.product_attributes_id}, '${element.attribute_detail_value}');
                    `)
            }

            let attributes = []
            for (const element of model.sub_product_attributes.sort((x, y) => x.product_attributes_id - y.product_attributes_id)) {
                const query = `select id from product_attribute_detail where attribute_id = ? and value = ?`
                const data = await database.executeQuery(query, [element.product_attributes_id, element.attribute_detail_value]) as RowDataPacket
                //console.log(data)
                if (data.length > 0) {
                    attributes.push(data[0].id)
                }
            }
            const parent = await database.executeQuery(`select * from ${this.tableName} where id = ${model.parent_id}`) as RowDataPacket
            if (parent.length > 0) {
                const productModel: CreateDto = {
                    parent_id: model.parent_id,
                    name: parent[0].name + "-" + names.join("-"),
                    price: model.price || parent[0].price,
                    price_wholesale: model.price_wholesale || parent[0].price_wholesale,
                    price_import: model.price_import || parent[0].price_import,
                    weight: model.weight,
                    created_id: model.created_id,
                    seller_id: model.seller_id,
                    product_attribute: attributes.join("-"),
                    unit_id: model.unit_id || parent[0].unit_id,
                    product_type_id: model.product_type_id || parent[0].product_type_id,
                    max_inventory: model.max_inventory || parent[0].max_inventory,
                    min_inventory: model.min_inventory || parent[0].min_inventory,
                    prefix_quantity: model.prefix_quantity || 0,
                    commission: model.commission || parent[0].commission,
                    tax_vat_in: model.tax_vat_in || parent[0].tax_vat_in,
                    tax_vat_out: model.tax_vat_out || parent[0].tax_vat_out,
                    warranty_period: model.warranty_period || parent[0].warranty_period,
                    warranty_place: model.warranty_place || parent[0].warranty_place,
                    warranty_form: model.warranty_form || parent[0].warranty_form,
                    warranty_instructions: model.warranty_instructions || parent[0].warranty_instructions,
                    detail_info: model.detail_info || parent[0].detail_info,
                    description: model.description || parent[0].description,
                    highlights: model.highlights || parent[0].highlights,
                    is_topdeal: model.is_topdeal || parent[0].is_topdeal,
                    brand_id: model.brand_id || parent[0].branch_id,
                    is_sell: model.is_sell || parent[0].is_sell,
                    supplier_id: model.supplier_id || parent[0].supplier_id,
                    content: model.content || parent[0].content,
                    title: model.title || parent[0].title,
                    category_id: model.category_id || parent[0].category_id,
                    tax_apply: model.tax_apply || parent[0].tax_apply,
                    notify: model.notify || parent[0].notify,
                    is_authentic: model.is_authentic || parent[0].is_authentic,
                    is_freeship: model.is_freeship || parent[0].is_freeship,
                    can_return: model.can_return || parent[0].can_return,
                    brand_origin: model.brand_origin || parent[0].brand_origin,
                    made_in: model.made_in || parent[0].made_in,
                    type: model.type || 'normal'
                }
                //console.log('aaa', productModel)
                const result = await this.createProduct(productModel, undefined) as any
                if (image) {
                    let data
                    data = image.split('\\')
                    if (data.length === 1) {
                        data = data[0].split('/')
                    }
                    await database.executeQuery(`insert into product_image set (product_id, image, publish, created_id, seller_id) values (?, ?, ?, ?, ?)`, [result.data.id, data, 1, model.created_id, model.seller_id])
                }
                if (result instanceof HttpException) {
                    return new HttpException(400, errorMessages.UPDATE_FAILED, 'product');
                }

            }
        }
    }

    public createProduct = async (model: CreateDto, listImage?: string, import_Warehouse?: boolean) => {
        //console.log(model, listImage)
        let sellerCodeQuery = `SELECT code from seller WHERE id = ?`
        const sellerCode = await database.executeQuery(sellerCodeQuery, [model.seller_id]) as RowDataPacket
        const parent_code = await database.executeQuery(`SELECT code from product where id = ${model.parent_id}`) as RowDataPacket
        if (model.price && model.price_sale && Number(model.price) < Number(model.price_sale)) {
            return new HttpException(400, errorMessages.PRICE_SALE_GREATER_THAN_PRICE, 'price_sale')
        }
        model.unit_id = (model.unit_id as any * 1)
        let code: string;

        if (model.code && model.code.length > 0) {
            code = model.code
            if (code && await checkExist(this.tableName, this.fieldCode, sellerCode[0].code + code))
                return new HttpException(400, errorMessages.CODE_EXISTED, this.fieldCode);
        } else code = await generateCodeWithSeller(this.tableName, 'SP', 8, model.seller_id as number) as string;

        // set title
        if (!model.title || model.title == '') {
            model.title = model.name;
        }
        // create slug from name
        let slug = '';
        if (model.name && model.name != '') {
            slug = (await this.slugService.genSlug(model.name!)).data
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
        price, 
        price_wholesale, 
        price_sale, 
        price_import, 
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
        parent_id, 
        attributes, 
        weight_id, 
        brand_origin, 
        made_in,
        publish_yomart,
        type
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`
        let values = [
            code,
            model.name,
            model.publish ?? 1,
            model.is_topdeal ?? 1,
            model.weight || null,
            model.unit_id || null,
            model.price || 0,
            model.price_wholesale || 0,
            model.price_sale || 0,
            model.price_import || 0,
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
            model.parent_id || 0,
            (!model.parent_id || model.parent_id === 0) ? null : model.product_attribute,
            model.weight_id || 1,
            model.brand_origin || null,
            model.made_in || null,
            model.publish_yomart || 0,
            model.type || 'normal'
        ]
        //console.log(query, values)
        const result = await database.executeQuery(query, values) as any;
        let productId = (result as RowDataPacket).insertId
        // upload and save img list
        if (listImage) {
            let modelProductImage: ProductImage = {
                product_id: productId,
                image: listImage,
                created_id: model.created_id,
                publish: model.publish ?? 1
            }
            await this.productImageService.create(modelProductImage)
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
        // tao slug
        await this.slugService.create('product', slug)
        return {
            data: {
                id: (result as any).insertId,
                code,
                ...model,
                images: listImage ? `${process.env.PRODUCT_UPLOAD_IMAGE}/${parent_code[0].code}/${listImage}` : null,
                created_at: create_at,
                updated_at: update_at
            }
        }
    }

    public updateListSubProductImage = async (listId: number[], image: string, created_id: number) => {
        if (listId.length > 0) {
            for (const element of listId) {
                await this.updateSubProductImage(image, element, created_id)
            }
        }
        else return new HttpException(404, 'danh sách phiên bản không được rỗng')
    }

    public getProducts = async (user_id: number, key: string, seller_id: number, pageInput?: number, limitInput?: number) => {
        //console.log(pageInput, limitInput)
        let branches: number[] = []
        const branch_id = await database.executeQuery(`select branch_id from employee_branch where user_id = ?`, [user_id]) as RowDataPacket
        if (branch_id.length > 0 && !branch_id.map((item: any) => item.branch_id).includes(0)) {
            branches = branch_id.map((item: any) => item.branch_id)
        }
        let query = `
            	select 
                p.* , 
                pu.name as unit_name,
                GROUP_CONCAT(
                    DISTINCT 
                    CASE 
                        WHEN pi.image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'id', pi.id,
                                'image', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = p.parent_id), p.code), '/', pi.image),
                                'image_thumbnail', CONCAT('${process.env.PRODUCT_UPLOAD_IMAGE}/', COALESCE((select code from product where id = p.parent_id), p.code), '/thumbnail/', pi.image)
                            )
                        ELSE NULL 
                    END
                ) AS images,
                u.name as created_name, 
                c.name as category_name, 
                pt.id as product_type_id,  
                pt.name as product_type_name, 
                b.id as brand_id , 
                b.name as brand_name, 
                pc.commission as commission, 
                sp.name as supplier_name,
                COALESCE(
                    (
                        SELECT SUM(w.quantity)
                        FROM warehouse w 
                        WHERE p.id = w.product_id ${branches.length > 0 ? ` and w.branch_id IN (${branches})` : ``}
                    ), 
                    0
                ) as inventory
                
                FROM product p  
                LEFT JOIN warehouse w ON w.product_id = p.id
                LEFT JOIN product_type pt ON p.product_type_id = pt.id
                LEFT JOIN supplier sp ON p.supplier_id = sp.id
                LEFT JOIN product_category c ON p.category_id = c.id
                LEFT JOIN users u ON p.created_id = u.id
                LEFT JOIN brand b ON p.brand_id = b.id 
                LEFT JOIN product_commission pc ON p.id = pc.product_id 
                LEFT JOIN product_unit pu ON pu.id = p.unit_id 
                LEFT JOIN product_image pi ON pi.product_id = p.id 
                    AND pi.id = (
                        SELECT MIN(id)
                        FROM product_image
                        WHERE product_image.product_id = p.id
                    )
                WHERE
                p.seller_id = ? AND p.type = 'normal' ${key !== undefined ? ` AND p.name LIKE '%${key}%'` : ``}
                AND p.id NOT IN (
                    SELECT p.id 
                    FROM product p
                    LEFT JOIN purchase_order_detail pod ON pod.product_id = p.id
                    LEFT JOIN purchase_order_status_history posh ON pod.order_id = posh.order_id
                    LEFT JOIN purchase_order po ON po.id = pod.order_id 
                    WHERE (SELECT COUNT(id) FROM product WHERE parent_id = p.id) > 0
                    GROUP BY p.id
                )
                GROUP BY p.id, p.seller_id 
                ORDER BY p.id DESC
           
        `
        if (pageInput && limitInput) {
            query += ` LIMIT ${limitInput} OFFSET ${(pageInput - 1) * limitInput}`
        }
        const countQuery = `
                    select p.id                     
                    from product p  
                    WHERE  
                    p.seller_id = ?  ${key !== undefined ? ` and p.name like '%${key}%'` : ` `}
                    and p.id not in (
                    select p.id from product p
                    left join purchase_order_detail pod on pod.product_id = p.id
                    left join purchase_order_status_history posh on pod.order_id = posh.order_id
                    left join purchase_order po on po.id = pod.order_id 
                    where (select count(id) from product where parent_id = p.id) > 0
                    group by p.id)
                    group by p.id, p.seller_id order by p.id desc;`
        const count = await database.executeQuery(countQuery, [seller_id]) as RowDataPacket
        const result = await database.executeQuery(query, [seller_id]) as RowDataPacket[]
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        let pagination: IPagiantion = {
            page: pageInput,
            limit: limitInput,
            totalPage: limitInput ? Math.ceil(count.length / limitInput) : null
        }
        for (const item of result) {
            item.available = (await this.warehouseService.getAvailableQuantity(item.id, branches, seller_id)).data * 1
        }
        return {
            data: result.map((item: any) => { return { ...item, images: item.images ? JSON.parse('[' + item.images + ']') : [] } }),
            pagination: pagination
        }
    }


    public getProductBySellerId = async (seller_id: string) => {
        const query = `SELECT id FROM product WHERE seller_id = ?`;
        const result = await database.executeQuery(query, [seller_id]) as RowDataPacket[];
        if (result.length === 0) {
            return new HttpException(404, errorMessages.NOT_FOUND);
        }
        return result;
    }
}

export default ProductService;




