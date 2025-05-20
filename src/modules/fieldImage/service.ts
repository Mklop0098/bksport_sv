import database from "@core/config/database";
import { CreateDto } from "./dtos/Create.dto";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import { IPagiantion } from "@core/interfaces";
import { RowDataPacket } from "mysql2";
import errorMessages from "@core/config/constants";
import path from "path";
import fs from "fs";
import { error } from "console";
import sharp from "sharp";

class FieldImageService {
    private tableName = 'field_images';
    private fieldId = 'id'

    public create = async (model: CreateDto) => {
        let query = `insert into ${this.tableName} (field_id, image, publish, created_id) values (?, ?, ?, ?)`;
        let values = [
            model.field_id,
            model.image,
            model.publish,
            model.created_id
        ]
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.CREATE_FAILED);
        return {
            data: {
                id: (result as any).insertId,
                ...model
            }
        }
    }
    public update = async (model: CreateDto, id: number) => {

        let query = `update ${this.tableName} set `;
        let values = [];
        if (model.image) {
            query += `image = ?, `;
            values.push(model.image);
        }
        if (model.publish) {
            query += `publish = ?, `;
            values.push(model.publish);
        }
        query += `updated_at = ? where id = ?`;
        values.push(new Date());
        values.push(Number(id));
       //console.log(query, values)
        const result = await database.executeQuery(query, values);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.UPDATE_FAILED);
        return {
            data: {
                id: id,
                ...model,
                updated_at: new Date()
            }
        }
    }

    private deleteImage = async (productDir: string, fileName: string) => {
        const imagePath = path.resolve(productDir, fileName);
    
        try {
            if (!fs.existsSync(imagePath)) {
                return new HttpException(404, errorMessages.FILE_NOT_FOUND);
            }
    
            fs.unlinkSync(imagePath);
    
            // Kiểm tra nếu thư mục trống thì xoá luôn thư mục
            const isDirEmpty = fs.readdirSync(productDir).length === 0;
            if (isDirEmpty) {
                fs.rmSync(productDir, { recursive: true, force: true })
            }
        } catch (error) {
            console.error('Failed to delete image:', error);
            return new HttpException(500, errorMessages.DELETE_FAILED);
        }
    }


    public delete = async (id: number) => {
       //console.log(id)
        if (!await checkExist(this.tableName, this.fieldId, id.toString()))
            return new HttpException(400, errorMessages.EXISTED);
        const query = `SELECT fi.image, f.code, f.parent_id FROM field_image fi LEFT JOIN field f ON fi.field_id = f.id WHERE fi.id = ?`
        const imageData = await database.executeQuery(query, [id]) as RowDataPacket
        const {image, code} = (imageData as any)[0]
        const result = await database.executeQuery(`delete from ${this.tableName} where id = ?`, [id]);
        
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        await this.deleteImage(path.resolve(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH + `/${code}/thumbnail`), image)
        await this.deleteImage(path.resolve(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH + `/${code}`), image);
        if (imageData.length > 0 && imageData[0].parent_id == 0) {
            await this.deleteImage(path.resolve(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH + `/${code}/thumbnail`), image)
            await this.deleteImage(path.resolve(__dirname, process.env.FIELD_UPLOAD_IMAGE_PATH + `/${code}`), image)
        }
        return {
            message: errorMessages.DELETE_SUCCESS,
            id: id
        }
    }
   

    public findById = async (id: number) => {
        const result = await checkExist(this.tableName, this.fieldId, id.toString());
        if (result == false)
            return new HttpException(400, errorMessages.EXISTED);
        return {
            data: (result as any)[0]
        }
    }
    public searchs = async (key: string, image: string, publish: boolean, page: number, limit: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and image like '%${key}%'`
            countQuery += ` and image like '%${key}%'`
        }
        if (image && image.length != 0) {
            query += ` and image like '%${image}%'`
            countQuery += ` and image like '%${image}%'`
        }
        if (publish) {
            query += ` and publish = ${publish}`
            countQuery += ` and publish = ${publish}`
        }
        query += ` order by id desc`
        //console.log(query);
        if (page && page < 1 || page && limit < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (page && limit)
            query = query + ` LIMIT ` + limit + ` OFFSET ` + (page - 1) * limit;
        let pagination: IPagiantion = {
            page: page,
            limit: limit,
            totalPage: 0
        }
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limit);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages
        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND)
        return {
            data: result,
            pagination: pagination
        }
    }
    public updatePublish = async (id: number) => {
        try {
            let result = null;
            let publish = 0
            const update_at = new Date()
            const getPublish = await database.executeQuery(`select publish from ${this.tableName} where id = ?`, [id]);
            if ((getPublish as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            if ((getPublish as RowDataPacket[])[0].publish == 0) {
                publish = 1
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
            }
            if ((getPublish as RowDataPacket[])[0].publish == 1) {
                result = await database.executeQuery(`update ${this.tableName} set publish = ?, updated_at = ? where id = ?`, [publish, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    publish: publish,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public deleteRows = async (data: number[]) => {
        let query = `delete from ${this.tableName} where id in (${data})`
        const result = await database.executeQuery(query);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            message: errorMessages.DELETE_SUCCESS
        }
    }

    public deleteByProductId = async (id: number) => {
        const exist = await checkExist(this.tableName, 'field_id', id);
        try {
            if (exist.length > 0) {
                let query = `delete from ${this.tableName} where field_id = ?`
                await database.executeQuery(query, [id]);
                return {
                    message: errorMessages.DELETE_SUCCESS
                }
            }
        } catch (error) {
            return new HttpException(400, errorMessages.DELETE_FAILED);
        }    
    }

    public findAllFieldImageByProductId = async (id: number) => {
        const result = await database.executeQuery(`select * from ${this.tableName} where field_id = ?`, [id]);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(404, errorMessages.NOT_FOUND);
        if (Array.isArray(result) && result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                (result as any)[i].image_thumbnail = this.convertPathOfImage((result as any)[i].image, (result as any)[i].code, 'thumbnail');
                (result as any)[i].image = this.convertPathOfImage((result as any)[i].image, (result as any)[i].code);
                (result as any)[i].images = result;
            }
        }
        return {
            data: {
                ...(result as RowDataPacket[])[0],
            }
        }
    }
    private convertPathOfImage = (image: string, code: string, type?: string) => {
        let userDir = ''
        if (type === 'thumbnail') {
            userDir = path.join(process.env.FIELD_UPLOAD_IMAGE as string, code, 'thumbnail');
        }
        else {
            userDir = path.join(process.env.FIELD_UPLOAD_IMAGE as string, code);
        }
        const rePath = path.join(userDir, image)
        return rePath
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

    private convertNameImage = (image: string, num?: number) => {
        const name = this.removeVietnameseAccents(image)
            .replace(/\s+/g, '_')
            .toLowerCase();
        if (num !== undefined || num !== null) {
            return name + '_' + (num as number + 1);
        }
        else {
            return name;
        }
    }
    private createFolderIfNotExist = async (dir: string, callback: (error: Error | null) => void) => {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            callback(null)
        } catch (error) {
            callback(error as Error)
        }
    }
    private uploadImage = async (file: Express.Multer.File, dir: string, productName: string, num: number) => {
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
        let userDir = path.resolve(dir);
        let userDirThumbnail = path.resolve(dir, 'thumbnail');
        try {
            await this.createFolderIfNotExist(userDir, (error) => {
                if (error) return new HttpException(500, errorMessages.UPLOAD_FAILED);
            });
            await this.createFolderIfNotExist(userDirThumbnail, (error) => {
                if (error) return new HttpException(500, errorMessages.UPLOAD_FAILED);
            });
            const imageName = this.convertNameImage(productName, num) + fileExtension;
            const pathImage = path.resolve(userDir, imageName);
            const pathImageThumbnail = path.resolve(userDirThumbnail, imageName);
            await sharp(file.buffer).toFile(pathImage);
            await sharp(file.buffer).resize(150, 150).toFile(pathImageThumbnail);
            return {
                pathImage: pathImage,
                pathImageThumbnail: pathImageThumbnail
            };
        } catch (error) {
            return new HttpException(500, errorMessages.UPLOAD_FAILED);
        }
    }

    public uploadOneImage = async (file: any, model: CreateDto) => {
        const id = model.field_id;
        let num: number | undefined;
        if (!id) return new HttpException(400, errorMessages.INVALID_ID);
        const check = await checkExist('field', 'id', id.toString());
        if (check == false) return new HttpException(404, errorMessages.NOT_FOUND);
        const checkQuantity = await database.executeQuery(`select count(*) as total from field_image where field_id = ?`, [id]);
        if (Array.isArray(checkQuantity) && checkQuantity.length > 0 && (checkQuantity as RowDataPacket[])[0].total + 1 > process.env.PRODUCT_IMAGE_QUANTITY! as any as number)
            return new HttpException(400, errorMessages.INVALID_FILE_QUANTITY);
        const lastRow = await database.executeQuery(`select * from field_image where field_id = ? order by id desc limit 1`, [id]);
        //console.log("lastRow", lastRow);
        if ((lastRow as any).length > 0) {
            const match = (lastRow as RowDataPacket)[0].image.match(/_(\d+)\./);
            num = match ? parseInt(match[1]) : 0;
        }
        const code = (check as RowDataPacket[])[0].code
        const userDir = path.join(__dirname, process.env.FIELD_UPLOAD_IMAGE as string, code);
        const resultUpload = await this.uploadImage(file, userDir, check[0].name, num as number);
        // if (resultUpload instanceof HttpException) return resultUpload;
        //console.log("resultUpload", resultUpload);
        
        if (!file) return new HttpException(400, errorMessages.INVALID_FILE);
        let query = `insert into field_image (field_id, image, publish, created_id, created_at, updated_at) values (?, ?, ?, ?, ?, ?)`;
        let values = [
            id,
            file.filename,
            1,
            id,
            new Date(),
            new Date()
        ]
        // const result = await database.executeQuery(query, values);
        // if ((result as any).affectedRows === 0)
        //     return new HttpException(400, errorMessages.CREATE_FAILED);
        return {
            data: {
                // id: (result as any).insertId,
                field_id: id,
                image: file.filename,
                publish: 1,
                created_id: id,
                created_at: new Date(),
                updated_at: new Date()
            }
        }
    }
}

export default FieldImageService;