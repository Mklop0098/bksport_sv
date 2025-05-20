import database from "@core/config/database";
import { CreateDto } from "./dtos/create.dto";
import { UpdateDto } from "./dtos/update.dto";
import { HttpException } from "@core/exceptions";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import { generateCodePrefixChar, generateNumberRandom } from "@core/utils/gennerate.code";
import { buildTree, findAllHighestParentIds, getAllProductCategory, getLeafNode } from "./utils";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { convertStringToSlug } from "@core/utils/convertStringToSlug";
import { json } from "sequelize";
import { checkExist } from "@core/utils/checkExist";
import SlugService from "@modules/slug/service";
import axios from "axios";
import { UploadImage } from "@core/utils/upload.image";

class ProductCategoryService {

    private tableName = 'product_category';
    private slugService = new SlugService()

    private createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private deleteFileIfExist = (filePath: string) => {
        console.log(filePath)
        try {
            if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
                console.log(`Xóa file thành công: ${filePath}`);
            }
        } catch (error) {
            console.error(`Lỗi khi xóa file ${filePath}:`, error);
        }
    };

    public uploadImage = async (file: Express.Multer.File, type: string, is_save?: boolean) => {
        const userDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string);
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

            const formData = new FormData();
            const fileBuffer = fs.readFileSync(uploadPath);
            const fileBlob = new Blob([fileBuffer], { type: file.mimetype });
            formData.append('files', fileBlob);
            formData.append('type', 'images');
            formData.append('module_code', 'MSP');
            formData.append('name', 'Ten san pham');
            formData.append('module_id', '2025');
            formData.append('module_type', 'product-category');
            formData.append('width', '350');
            formData.append('height', '350');
            const response = await axios.post('http://192.168.102.15:3006/api/v1/files', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            this.deleteFileIfExist(uploadPath)
            this.deleteFileIfExist(path.join(thumbailDir, `${type}${fileExtension}`))
            console.log(response.data)
            return response.data
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
    private awaitUploadImage = async (listImage: any, imageNames: string[], is_save = true) => {
        const awaitUploadImage = listImage.map(async (file: any, index: number) => {
            const upload = await this.uploadImage(file, imageNames[index] as string, is_save);
            return upload
        })
        return await Promise.all(awaitUploadImage)
    }

    public create = async (model: CreateDto, image: any) => {
        const slug = model.slug || ''

        const nameExist = await checkExist(this.tableName, 'name', model.name!)
        if (nameExist !== false) {
            return new HttpException(400, errorMessages.NAME_EXIST, 'name')
        }

        const exist = await this.slugService.checkSlug('product_category', slug)
        if (exist instanceof Error) {
            return new HttpException(400, 'Địa chỉ slug đã tồn tại', 'slug');
        }

        let listImage = image?.files ?? image;
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
            else imageNames = UploadImage.convertToImageName(model.name!, listImage)
        }

        // upload and save img list
        try {
            const query = `
                INSERT INTO ${this.tableName} (name, parent_id, publish, home, top, hot, is_topone, sort, slug, image, title, meta_description, type, content, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            const created_at = new Date()
            const values = [
                model.name,
                model.parent_id || 0,
                model.publish || 1,
                model.home || 0,
                model.top || 0,
                model.hot || 0,
                model.is_topone || 0,
                model.sort || 0,
                slug,
                null,
                model.title || "",
                model.meta_description || '',
                model.type || 1,
                model.content || "",
                created_at,
                created_at
            ]
            const result = await database.executeQuery(query, values) as RowDataPacket
            if (result.affectedRows === 0)
                return new HttpException(400, errorMessages.CREATE_FAILED);
            const data = await this.slugService.create('product_category', slug)
            if (Array.isArray(listImage) && listImage.length > 0) {
                const listPath = await UploadImage.awaitUploadImage(listImage, imageNames, 'images', slug, result.insertId.toString(), 'product-category', '350', '350', model.name!)
                if (listPath.statusCode === 200) {
                    await database.executeQuery(`update ${this.tableName} set image_id = ?, image = ? where id = ?`, [listPath.data[0].id, listPath.data[0].image, result.insertId])
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.CREATE_FAILED);
        }
    }

    public update = async (model: UpdateDto, id: number, image: any) => {
        if (model.parent_id === id) {
            return new HttpException(400, "Danh mục cha không hợp lệ")
        }
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist == false) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'id')
        }
        const nameExist = await database.executeQuery(`
            select id from ${this.tableName} where name = ?
        `, [model.name]) as RowDataPacket

        if (nameExist.length > 0 && nameExist[0].id != id) {
            return new HttpException(404, errorMessages.NAME_EXISTED)
        }

        const slugGen = await this.slugService.genSlug(model.name!)
        const oldSlug = await database.executeQuery(`select slug, image from ${this.tableName} where id = ?`, [id]) as RowDataPacket
        const slug = model.slug || slugGen.data

        if (oldSlug.length > 0 && oldSlug[0].slug !== slug) {
            const check = await this.slugService.checkSlug('product_category', slug)
            if (check instanceof Error) {
                return new HttpException(400, 'Địa chỉ slug đã tồn tại', 'slug')
            }
            await this.slugService.update('product_category', slug, oldSlug[0].slug)
        }

        // update image
        let listImage = image?.files ?? image;
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
            else imageNames = this.convertToImageName(model.slug || exist[0].slug, listImage)
        }

        // upload and save img list
        let resultImage
        if (Array.isArray(listImage) && listImage.length > 0) {

            if (oldSlug.length > 0) {
                const userDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string, oldSlug[0].slug);
                const thumbailDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string, 'thumbnail', oldSlug[0].slug);
                this.deleteFileIfExist(userDir)
                this.deleteFileIfExist(thumbailDir)
            }

            const listPath: string[] = await Promise.all(await this.awaitUploadImage(listImage, imageNames))
            resultImage = listPath[0]
        }

        try {
            let params = []
            let query = `update ${this.tableName} set `
            if (model.name !== undefined) {
                query += ` name = ?, `
                params.push(model.name)
            }
            if (model.publish !== undefined) {
                query += ` publish = ?, `
                params.push(model.publish)
            }
            if (model.home !== undefined) {
                query += ` home = ?, `
                params.push(model.home)
            }
            if (model.top !== undefined) {
                query += ` top = ?, `
                params.push(model.top)
            }
            if (model.hot !== undefined) {
                query += ` hot = ?, `
                params.push(model.hot)
            }
            if (model.is_topone !== undefined) {
                query += ` is_topone = ?, `
                params.push(model.is_topone)
            }
            if (model.sort !== undefined) {
                query += ` sort = ?, `
                params.push(model.sort)
            }
            if (model.slug !== undefined) {
                query += ` slug = ?, `
                params.push(slug)
            }
            if (model.title !== undefined) {
                query += ` title = ?, `
                params.push(model.title)
            }
            if (model.meta_description !== undefined) {
                query += ` meta_description = ?, `
                params.push(model.meta_description)
            }
            if (model.parent_id !== undefined) {
                query += ` parent_id = ?, `
                params.push(Number(model.parent_id))
            }
            if (model.type !== undefined) {
                query += ` type = ?, `
                params.push(model.type)
            }
            if (resultImage !== undefined) {
                query += ` image = ?, `
                params.push(resultImage)
            }
            const updated_at = new Date()
            query += ` updated_at = ? where id = ?`
            params.push(updated_at)
            params.push(id)
            console.log(query, params)

            const result = await database.executeQuery(query, params) as RowDataPacket
            if (result.affectecRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }
            await this.slugService.create('product_category', slug)

        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public delete = async (list_id: number[]) => {
        try {
            for (const element of list_id) {
                const result: number[] = []
                const query = `SELECT id, name, parent_id FROM ${this.tableName}`
                const data = await database.executeQuery(query) as RowDataPacket
                const ids = getAllProductCategory(data, Number(element))
                result.push(...ids);
                console.log("result", result)
                if (result.length > 0) {
                    const exist = await database.executeQuery(`select id from product where category_id in (${result})`) as RowDataPacket
                    if (exist.length > 0) {
                        return new HttpException(400, "Tồn tại sản phẩm thuộc loại sản phẩm này", 'product_category')
                    }
                    for (const element of result) {
                        const slug = await database.executeQuery(`select slug from product_category where id = ${element}`) as RowDataPacket
                        console.log(slug)
                        if (slug.length > 0) {
                            const data = await this.slugService.delete('product_category', slug[0].slug)
                            console.log(data)
                        }
                        await this.deleteImage(element)
                    }
                    const deleteResult = await database.executeQuery(`delete from ${this.tableName} where id in (${result})`) as RowDataPacket
                    if (deleteResult.affectedRows === 0) {
                        return new HttpException(400, errorMessages.DELETE_FAILED)
                    }
                }
            }

        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED)
        }
    }

    public searchs = async (key: string, status: string[], page: number, limit: number) => {
        try {
            if (key || status) {

                console.log(key, status, typeof status)
                let query = `
                    SELECT product_category.id AS 'key', id, name, publish, home, top, hot, is_topone, sort, slug, title, meta_description, content, parent_id, created_at, updated_at, type, 
                    CASE 
                        WHEN image IS NOT NULL THEN 
                            JSON_OBJECT(
                                'image', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', image),
                                'image_thumbnail', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', 'thumbnail/', image)
                            )
                        ELSE NULL 
                    END as image
                    FROM product_category where 1 = 1
                `
                if (key !== undefined) {
                    query += ` and name LIKE '%${key.trim()}%' `
                }
                if (status && status.includes('publish')) {
                    query += ` and publish = 1 `
                }
                if (status && status.includes('home')) {
                    query += ` and home = 1 `
                }
                if (status && status.includes('hot')) {
                    query += ` and hot = 1 `
                }
                if (status && status.includes('is_topone')) {
                    query += ` and is_topone = 1 `
                }
                if (status && status.includes('top')) {
                    query += ` and top = 1 `
                }
                const count = await database.executeQuery(query) as RowDataPacket
                console.log(count)

                if (page !== undefined && limit !== undefined) {
                    query += ` LIMIT ${limit} OFFSET ${(page - 1) * limit}`
                }
                console.log(query)
                const data = await database.executeQuery(query) as RowDataPacket
                console.log(data)
                const res = data.map((item: any) => { return { ...item, image: JSON.parse(item.image) } })
                console.log(res)
                let pagination: IPagiantion = {
                    page: 1 * (page || 0),
                    limit: 1 * (limit || 0),
                    totalPage: limit ? Math.ceil(count.length / limit) : null
                }
                return {
                    data: res,
                    pagination
                }
            }
            let query = `
            SELECT product_category.id AS 'key', id, name, publish, home, top, hot, is_topone, sort, slug, title, meta_description, content, parent_id, created_at, updated_at, type, 
            CASE 
                WHEN image IS NOT NULL THEN 
                    JSON_OBJECT(
                        'image', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', image),
                        'image_thumbnail', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', 'thumbnail/', image)
                    )
                ELSE NULL 
            END as image
            FROM product_category`
            const data = await database.executeQuery(query) as RowDataPacket[]
            const res = data.map((item: any) => { return { ...item, image: JSON.parse(item.image) } })
            const result = buildTree(res)
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FIND_ALL_FAILED)
        }
    }

    public getAllChildById = async (id: number) => {
        try {
            const query = `SELECT id, name, parent_id FROM ${this.tableName}`
            const data = await database.executeQuery(query)
            const result = getAllProductCategory((data as any), Number(id))
            return result

        } catch (error) {
            return new HttpException(400, errorMessages.FIND_ALL_FAILED)
        }
    }

    public getAllChildByListId = async (listId: number[]) => {
        for (const element of listId) {
            const result: number[] = []
            const query = `SELECT id, name, parent_id FROM ${this.tableName}`
            const data = await database.executeQuery(query) as RowDataPacket
            const ids = getAllProductCategory(data, Number(element))
            result.push(...ids);
            return {
                data: result
            }
        }
        return {
            data: []
        }
    }

    public getRootCategories = async () => {
        try {
            const query = `SELECT id, name FROM ${this.tableName} WHERE parent_id = 0`
            const data = await database.executeQuery(query) as RowDataPacket[]
            return {
                data
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FIND_ALL_FAILED)
        }
    }

    public getDataForSelect = async (publish: number) => {
        try {
            let query = `SELECT id, name, parent_id FROM ${this.tableName} where 1 = 1`
            if (publish == 1) {
                query += ` and publish = 1`
            }
            const data = await database.executeQuery(query)
            const result = buildTree((data as any))
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FIND_ALL_FAILED)
        }
    }

    public getDataForSelectExcept = async (id: number) => {
        try {
            const query = `SELECT id, name, parent_id FROM ${this.tableName} where id != ${id}`
            const data = await database.executeQuery(query)
            const result = buildTree((data as any))
            return {
                data: result
            }

        } catch (error) {
            return new HttpException(400, errorMessages.FIND_ALL_FAILED)
        }
    }

    public updateAttribute = async (list_id: number[], fields: string[], publish: number) => {
        if (fields.length < 1) {
            return new HttpException(400, errorMessages.MISSING_DATA)
        }
        try {
            const categories = await this.getAllChildByListId(list_id)
            if (categories.data.length > 0) {
                let params = []
                let query = `update ${this.tableName} set`
                if (fields.includes('publish')) {
                    query += ` publish = ?, `
                    params.push(publish)
                }
                if (fields.includes('hot')) {
                    query += ` hot = ?, `
                    params.push(publish)
                }
                if (fields.includes('top')) {
                    query += ` top = ?, `
                    params.push(publish)
                }
                if (fields.includes('home')) {
                    query += ` home = ?, `
                    params.push(publish)
                }
                if (fields.includes('is_topone')) {
                    query += ` is_topone = ?, `
                    params.push(publish)
                }
                const updated_at = new Date()
                query += ` updated_at = ?  where id in (${categories.data})`
                params.push(updated_at)
                const result = await database.executeQuery(query, params) as RowDataPacket
                if (result.affectedRows === 0) {
                    return new HttpException(400, errorMessages.UPDATE_FAILED)
                }
            }

        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public getById = async (id: number) => {
        console.log(id)
        try {
            const exist = await checkExist(this.tableName, 'id', id)
            if (exist === false) {
                return new HttpException(404, errorMessages.NOT_FOUND, 'id')
            }
            const query = `
                SELECT id, name, publish, home, top, hot, is_topone, sort, slug, title, meta_description, content, parent_id, created_at, updated_at, type, 
                CASE 
                    WHEN image IS NOT NULL THEN 
                        JSON_OBJECT(
                            'image', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', image),
                            'image_thumbnail', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', 'thumbnail/', image)
                        )
                    ELSE NULL 
                END as image
                FROM product_category WHERE id = ${id}`
            console.log(query)
            const result = await database.executeQuery(query) as RowDataPacket
            console.log(result)
            const data = result.map((item: any) => { return { ...item, image: JSON.parse(item.image) } })
            return {
                data: data[0]
            }

        } catch (error) {
            return new HttpException(400, errorMessages.SEARCH_FAILED)
        }
    }

    public deleteImage = async (id: number) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist == false) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'id')
        }
        try {
            const oldSlug = await database.executeQuery(`select image from ${this.tableName} where id = ?`, [id]) as RowDataPacket
            const userDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string, oldSlug[0].image);
            const thumbDir = path.join(__dirname, process.env.CATEGORY_UPLOAD_IMAGE_PATH as string, 'thumbnail', oldSlug[0].image);
            this.deleteFileIfExist(userDir)
            this.deleteFileIfExist(thumbDir)
            await database.executeQuery(`update ${this.tableName} set image = NULL where id = ?`, [id])
        } catch (error) {
            return new HttpException(404, errorMessages.DELETE_FAILED)
        }

    }

    public updateSort = async (sort: number, id: number) => {
        try {
            const exist = await checkExist(this.tableName, 'id', id)
            if (exist === false) {
                return new HttpException(404, errorMessages.NOT_FOUND, 'id')
            }
            const query = `
                update ${this.tableName} set sort = ? where id = ?
            `
            const result = await database.executeQuery(query, [sort, id]) as RowDataPacket
            if (result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public updateSingleAttribute = async (id: number, field: string) => {
        const exist = await checkExist(this.tableName, 'id', id)
        if (exist === false) {
            return new HttpException(404, errorMessages.NOT_FOUND, 'id')
        }
        try {
            let result
            const oldData = await database.executeQuery(`select ${field} as field from ${this.tableName} where id = ?`, [id]) as RowDataPacket
            const updated_at = new Date()
            let query = `update ${this.tableName} set ${field} = ?, updated_at = ? where id = ${id}`
            if (oldData[0].field === 0) {
                result = await database.executeQuery(query, [1, updated_at]) as RowDataPacket
            }
            else {
                result = await database.executeQuery(query, [0, updated_at]) as RowDataPacket
            }
            if (!result || result.affectedRows === 0) {
                return new HttpException(400, errorMessages.UPDATE_FAILED)
            }

        } catch (error) {
            return new HttpException(400, errorMessages.UPDATE_FAILED)
        }
    }

    public getLeafNode = async (seller_id: number) => {
        let query = `
            SELECT product_category.id AS 'key', id, name, publish, home, top, hot, is_topone, sort, slug, title, meta_description, content, parent_id, created_at, updated_at, type, 
            CASE 
                WHEN image IS NOT NULL THEN 
                    JSON_OBJECT(
                        'image', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', image),
                        'image_thumbnail', CONCAT('${process.env.CATEGORY_UPLOAD_IMAGE}/', 'thumbnail/', image)
                    )
                ELSE NULL 
            END as image
            FROM product_category`
        const data = await database.executeQuery(query) as RowDataPacket[]
        const res = data.map((item: any) => { return { ...item, image: JSON.parse(item.image) } })
        const queryParentId = `SELECT category_id FROM seller_category WHERE seller_id = ?`
        const parentId = await database.executeQuery(queryParentId, [seller_id]) as RowDataPacket
        console.log(parentId)
        const result = await getLeafNode(res, parentId.map((item: any) => item.category_id))
        console.log(result)
        return {
            data: result
        }
    }
}

export default ProductCategoryService