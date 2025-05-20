import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateCodeWithSeller } from "@core/utils/gennerate.code";
import path from "path";
import sharp from "sharp";
import fs from "fs";
import SlugService from "@modules/slug/service";
import FieldImageService from "@modules/fieldImage/service";
import { CreateDto as FieldImage } from "@modules/fieldImage";
class FieldsService {

    private tableName = 'fields';
    private fieldCode = 'code'
    private slugService = new SlugService()
    private fieldImageService = new FieldImageService()
    private createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
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

    public uploadImage = async (code: string, file: Express.Multer.File, type: string, is_save?: boolean) => {
        const userDir = path.join(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH as string, code);
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
            userDir = path.join(process.env.FIELD_UPLOAD_IMAGE_PATH as string, code, 'thumbnail');
        }
        else {
            userDir = path.join(process.env.FIELD_UPLOAD_IMAGE_PATH as string, code);
        }
        const rePath = listImage.map((image: string) => {
            const uploadPath = path.join(userDir, image)
            return uploadPath
        })
        return rePath
    }

    public getAllFields = async (id: number) => {
        try {
            const unFollowQuery = `
                SELECT f.user_id, u.name FROM ${this.tableName} f
                LEFT JOIN users u ON f.user_id = u.id
                WHERE f.seller_id = ?
            `
            const result = await database.executeQuery(unFollowQuery, [id]) as RowDataPacket
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FOLLOW_ERROR)
        }
    }

    public createFields = async (model: CreateDto, listImageObject: any) => {
        try {
            console.log(model, listImageObject)
            let listImage = listImageObject?.files ?? listImageObject;
            let sellerCodeQuery = `SELECT code from seller WHERE id = ?`
            const sellerCode = await database.executeQuery(sellerCodeQuery, [model.seller_id]) as RowDataPacket

            if (model.price && model.price_sale && Number(model.price) < Number(model.price_sale)) {
                return new HttpException(400, errorMessages.PRICE_SALE_GREATER_THAN_PRICE, 'price_sale')
            }
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
                else imageNames = this.convertToImageName(model.name!, listImage)
            }

            if (model.code && model.code.length > 0) {
                code = model.code
                if (code && await checkExist(this.tableName, this.fieldCode, sellerCode[0].code + code))
                    return new HttpException(400, errorMessages.CODE_EXISTED, this.fieldCode);
            } else code = await generateCodeWithSeller(this.tableName, 'FD', 8, model.seller_id as number) as string;

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
            let query = `
                insert into ${this.tableName} (name, code, sport_id, seller_id, city_id, district_id, ward_id, address, price, price_sale, width, length, can_order, publish_yomart, publish, description, content, detail_info, highlights, title, meta_description, slug, created_id, is_topdeal, notify, attributes, created_at, updated_at) 
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            let values = [
                model.name,
                code,
                model.sport_id || 0,
                model.seller_id,
                model.city_id,
                model.district_id,
                model.ward_id,
                model.address,
                model.price,
                model.price_sale,
                model.width,
                model.length,
                model.can_order || 0,
                model.publish_yomart || 0,
                model.publish || 0,
                model.description || '',
                model.content || '',
                model.detail_info || '',
                model.highlights || '',
                model.title || '',
                model.meta_description || '',
                slug,
                model.created_id || 0,
                model.is_topdeal || 0,
                model.notify || 0,
                model.attributes || '',
                create_at,
                update_at
            ]
            console.log(query, values)
            const result = await database.executeQuery(query, values) as any;
            if (Array.isArray(listImage) && listImage.length > 0) {
                const listPath: string[] = await Promise.all(await this.awaitUploadImage(code, listImage, imageNames))
                console.log(code, listImage, imageNames, model.created_id, result.insertId, listPath)
                for (let i = 0; i < listPath.length; i++) {
                    let modelFieldImage: FieldImage = {
                        field_id: result.insertId,
                        image: listPath[i],
                        created_id: model.created_id,
                        publish: model.publish ?? 1
                    }
                    await this.fieldImageService.create(modelFieldImage)
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED)
        }
    }


    public updateFields = async (model: CreateDto, id: number, listImage: any) => {
        let code = model.code
        let check: any = null
        let resultImage: any[] = []
        check = await checkExist(this.tableName, 'id', id.toString());
        if (check == false)
            return new HttpException(404, errorMessages.NOT_EXISTED, 'id');
        if (model.price && model.price_sale && Number(model.price) < Number(model.price_sale)) {
            return new HttpException(400, errorMessages.PRICE_SALE_GREATER_THAN_PRICE, 'price_sale')
        }
        if (listImage !== undefined && listImage.length > 0) {
            const countImage = await database.executeQuery(`select count(*) as total from field_image where field_id = ${id}`)
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
            const check = await this.slugService.checkSlug('field', slug)
            console.log(oldSlug[0].slug, slug, check)
            if (check instanceof Error) {
                return new HttpException(400, 'Địa chỉ slug đã tồn tại', 'slug')
            }
            await this.slugService.update('field', slug, oldSlug[0].slug)
        }


        let query = `update ${this.tableName} set `
        const values = []
        if (model.name) {
            query += ' name = ? , '
            values.push(model.name)
        }
        if (model.attributes) {
            query += ' attributes = ? , '
            values.push(model.attributes)
        }
        if (model.publish != undefined) {
            query += ' publish = ? , '
            values.push(model.publish)
        }
        if (model.is_topdeal != undefined) {
            query += ' is_topdeal = ? , '
            values.push(model.is_topdeal)
        }
        if (model.width != undefined) {
            query += ' width = ? , '
            values.push(model.width)
        }
        if (model.length != undefined) {
            query += ' length = ? , '
            values.push(model.length)
        }
        if (model.price != undefined) {
            query += ' price = ? , '
            values.push(model.price || 0)
        }
        if (model.price_sale != undefined) {
            query += ' price_sale = ? , '
            values.push(model.price_sale || 0)
        }
        if (model.city_id != undefined) {
            query += ' city_id = ? , '
            values.push(model.city_id || null)
        }
        if (model.district_id != undefined) {
            query += ' district_id = ? , '
            values.push(model.district_id || null)
        }
        if (model.ward_id != undefined) {
            query += ' ward_id = ? , '
            values.push(model.ward_id || null)
        }
        if (model.description != undefined) {
            query += ' description = ? , '
            values.push(model.description)
        }
        if (model.address != undefined) {
            query += ' address = ? , '
            values.push(model.address)
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
        if (model.sport_id != undefined) {
            query += ' sport_id = ? , '
            values.push(model.sport_id || null)
        }
        if (model.notify != undefined) {
            query += ' notify = ? , '
            values.push(model.notify)
        }
        if (model.can_order != undefined) {
            query += ' can_order = ? , '
            values.push(model.can_order || 0)
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

        query += `updated_at = ? where id = ?`;
        const update_at = new Date();
        values.push(update_at);
        values.push(parseInt(id as any));

        const result = await database.executeQuery(query, values) as RowDataPacket;
        // const result = await database.executeQuery(query, values);
        if (result.affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        if (listImage && listImage.length > 0) {
            const lastRow = await database.executeQuery(`SELECT * FROM field_image WHERE field_id =${id} order by id DESC limit 1`)
            let num
            if ((lastRow as any).length > 0) {
                const match = (lastRow as RowDataPacket)[0].image.match(/_(\d+)\./);
                num = match ? parseInt(match[1]) : 0;
            }

            const imageNames = this.convertToImageName((check as any)[0].name, listImage, num)
            const listPath: string[] = await Promise.all(await this.awaitUploadImage((check as any)[0].code, listImage, imageNames))
            for (let i = 0; i < listPath.length; i++) {
                let modelFieldImage: FieldImage = {
                    field_id: id,
                    image: listPath[i],
                    created_id: model.created_id,
                    publish: model.publish ?? 1
                }
                await this.fieldImageService.create(modelFieldImage).then((result) => {
                    const path = this.rePathOfImage([listPath[i]], check[0].code)
                    const pathThumbnail = this.rePathOfImage([listPath[i]], check[0].code, 'thumbnail');
                    (result as RowDataPacket).data.image = path[0];
                    (result as RowDataPacket).data.image_thumbnail = pathThumbnail[0];
                    resultImage.push((result as any).data)
                })
            }
        }
        if (code && code.length > 0) {
            const oldPath = path.join(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH as string, (check as any)[0].code)
            const newPath = path.join(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH as string, code)
            await this.renameDirectory(oldPath, newPath)
        }
        await this.slugService.create('field', slug)
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

    public search = async (seller_id: number) => {
        try {
            const query = `
                SELECT fd.*, su.name as sport_name,
                GROUP_CONCAT(
                    DISTINCT 
                    CASE 
                        WHEN fi.image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'id', fi.id,
                                'image', CONCAT('${process.env.FIELD_UPLOAD_IMAGE}/', fd.code, '/', fi.image),
                                'image_thumbnail', CONCAT('${process.env.FIELD_UPLOAD_IMAGE}/', fd.code, '/thumbnail/', fi.image)
                            )
                        ELSE NULL 
                    END
                ) AS images
                FROM ${this.tableName} fd 
                left join sport_unit su on su.id = fd.sport_id
                left join field_images fi on fi.field_id = fd.id
                where fd.seller_id = ?
                group by fd.id, fd.seller_id order by fd.id desc
            `
            const result = await database.executeQuery(query, [seller_id]) as RowDataPacket;
            return {
                data: result.map((item: any) => ({
                    ...item,
                    images: item.images ? JSON.parse('[' + item.images + ']') : []
                }))
            };  
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }

    public updatePublish = async (model: CreateDto, id: number) => {
        try {
            let result = null;
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]) as RowDataPacket;
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            const publicId = getPublish[0].publish
            result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publicId == 0 ? 1 : 0, update_at, id]);
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public updatePublishYomart = async (listId: number[], publishId: number, created_id: number) => {
        try {
            const update_at = new Date()
            for (const element of listId) {
                const result = await database.executeQuery(`update ${this.tableName} set publish_yomart = ?, updated_at = ? where id = ?`, [publishId, update_at, element]);
            }

        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }

    public findById = async (id: number) => {
        try {
            const query = `
                SELECT fd.*, su.name as sport_name, c.name as city_name, d.name as district_name, w.name as ward_name,
                GROUP_CONCAT(
                    DISTINCT 
                    CASE 
                        WHEN fi.image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'id', fi.id,
                                'image', CONCAT('${process.env.FIELD_UPLOAD_IMAGE}/', fd.code, '/', fi.image),
                                'image_thumbnail', CONCAT('${process.env.FIELD_UPLOAD_IMAGE}/', fd.code, '/thumbnail/', fi.image)
                            )
                        ELSE NULL 
                    END
                ) AS images 
                FROM ${this.tableName} fd 
                left join sport_unit su on su.id = fd.sport_id
                left join field_images fi on fi.field_id = fd.id
                left join city c on c.id = fd.city_id
                left join district d on d.id = fd.district_id
                left join ward w on w.id = fd.ward_id
                where fd.id = ?
            `
            const result = await database.executeQuery(query, [id]) as RowDataPacket;
            return {
                data: {
                    ...result[0],
                    images: result[0].images ? JSON.parse('[' + result[0].images + ']') : []
                }
            };  
        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }

    public findBookingDetail = async (id: number) => {
        const result = await database.executeQuery(`
            SELECT obd.* FROM order_booking_detail obd
            left join orders_booking ob on ob.id = obd.order_id
            left join fields fd on fd.id = ob.field_id
            WHERE ob.field_id = ?

            
        `, [id]) as RowDataPacket
        if (result.length === 0) {
            return new HttpException(400, "Không tìm thấy đơn hàng")
        }
        return {
            data: result
        }
    }
}

export default FieldsService