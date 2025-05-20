import { HttpException } from "@core/exceptions";
import bcryptjs, { compareSync } from 'bcryptjs';
import database from "@core/config/database";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import { Create } from "./dtos/create.dto";
import { IPagiantion } from "@core/interfaces";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import UserRoleService from "@modules/userRole/service";
import EmployeeBranchService from "@modules/emplyeeBranch/service";
import PermissionService from "@modules/permission/service";
import { CreateDto } from "./dtos/update.dto";
class UserServices {
    private tableName = 'users';
    private userRole = new UserRoleService()
    private employeeBranch = new EmployeeBranchService()
    private permissionService = new PermissionService();

    private createFolderIfNotExist = (dir: string) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    private renameFile = (code: string, oldPath: string, newPath: string) => {
        const userDir = path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, code);
        this.createFolderIfNotExist(userDir)
        fs.renameSync(oldPath, newPath);
    }
    public uploadImage = async (code: string, file: Express.Multer.File) => {
        const allowedFile = ['.png', '.jpg', '.jpeg']
        if (!allowedFile.includes(path.extname(file.originalname)))
            return new HttpException(400, errorMessages.INVALID_FILE);
        const userDir = path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, code);

        this.createFolderIfNotExist(userDir)
        const fileExtension = path.extname(file.originalname);
        const uploadPath = path.join(userDir, `${code}${fileExtension}`)
        const upload = await sharp(file.buffer).toFile(uploadPath)

        const files = fs.readdirSync(userDir);
        for (const fileName of files) {
            fs.unlinkSync(path.join(userDir, fileName));
        }

        if (upload) {
            await sharp(file.buffer).toFile(uploadPath);
            const relativePath = path.relative(
                path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, '..'),
                uploadPath
            );
            return relativePath
        }
        return new HttpException(400, errorMessages.UPLOAD_FAILED);
    }

    public updateActive = async (id: number) => {
        try {
            let result = null;
            let active = 0
            const update_at = new Date()
            const getactive = await database.executeQuery(`select active from ${this.tableName} where id = ?`, [id]);
            if ((getactive as RowDataPacket[]).length === 0)
                return new HttpException(404, errorMessages.NOT_FOUND);
            if ((getactive as RowDataPacket[])[0].active == 0) {
                active = 1
                result = await database.executeQuery(`update ${this.tableName} set active = ?, updated_at = ? where id = ?`, [active, update_at, id]);
            }
            if ((getactive as RowDataPacket[])[0].active == 1) {
                result = await database.executeQuery(`update ${this.tableName} set active = ?, updated_at = ? where id = ?`, [active, update_at, id]);
            }
            return {
                data: {
                    id: id,
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public create = async (model: Create, avatar: any) => {
        let pathAvatar
        const checkPhone = await checkExist(this.tableName, 'phone', model.phone!);
        if (checkPhone)
            return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
        // if (model.email != undefined) {
        //     const checkEmail = await checkExist(this.tableName, 'email', model.email);
        //     if (checkEmail)
        //         return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
        // }
        if (avatar != undefined) {
            const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxFileSize = process.env.PRODUCT_UPLOAD_IMAGE_SIZE! as any as number;
            if (!imageMimeTypes.includes(avatar.mimetype))
                return new HttpException(400, errorMessages.INVALID_FILE);
            if (avatar.size > maxFileSize)
                return new HttpException(400, errorMessages.INVALID_FILE_SIZE)
            const upload = await this.uploadImage(model.phone!, avatar);
            if (upload instanceof HttpException)
                return new HttpException(400, errorMessages.UPLOAD_FAILED)
            pathAvatar = upload as string;
        }
        try {
            const hashedPassword = await bcryptjs.hash(model.password!, 10);
            const created_at = new Date()
            const updated_at = new Date()
            let query = `INSERT INTO ${this.tableName} ( password, name, email, phone, avatar, active, created_at , updated_at, seller_id, text_password, created_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                hashedPassword,
                model.name,
                model.email,
                model.phone,
                pathAvatar || null,
                model.active || 1,
                created_at,
                updated_at,
                model.seller_id || 0,
                model.password || null,
                model.created_id || null
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId

            const userRole = {
                created_id: id,
                role_id: model.role_id || 1,
                user_id: id
            }
            const resultRole = await this.userRole.create(userRole)
            if (resultRole instanceof HttpException)
                return new HttpException(400, errorMessages.CREATE_ROLE_FAILED);
            if (model.branch_id && model.branch_id.length > 0) {
                if (model.branch_id.includes(0)) {
                    const employeeBranch = {
                        seller_id: model.seller_id,
                        branch_id: 0,
                        user_id: id
                    }
                    await this.employeeBranch.create(employeeBranch)
                }
                else {
                    for (const element of model.branch_id) {
                        const employeeBranch = {
                            seller_id: model.seller_id,
                            branch_id: element,
                            user_id: id
                        }
                        await this.employeeBranch.create(employeeBranch)
                    }
                }
            }
            else {
                const employeeBranch = {
                    seller_id: model.seller_id,
                    branch_id: 0,
                    user_id: id
                }
                await this.employeeBranch.create(employeeBranch)
            }
            delete (model as RowDataPacket).password;
            return {
                data: {
                    id: id,
                    ...model,
                    avatar: pathAvatar,
                    userRole: (resultRole.data) ? resultRole.data : null,
                    created_at: created_at,
                    updated_at: updated_at,
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public createUser = async (model: Create, avatar: any) => {
        let pathAvatar
        const checkPhone = await checkExist(this.tableName, 'phone', model.phone!);
        // if (model.email != undefined) {
        //     const checkEmail = await checkExist(this.tableName, 'email', model.email);
        //     if (checkEmail)
        //         return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
        // }
        if (avatar != undefined) {
            const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!imageMimeTypes.includes(avatar.mimetype))
                return new HttpException(400, errorMessages.INVALID_FILE);
            const upload = await this.uploadImage(model.phone!, avatar);
            if (upload instanceof HttpException)
                return new HttpException(400, errorMessages.UPLOAD_FAILED)
            pathAvatar = upload as string;
        }
        try {
            if (model.active != undefined) {
                model.active = true ? 1 : 0
            }
            const hashedPassword = model.password;
            const created_at = new Date()
            const updated_at = new Date()
            let query = `INSERT INTO ${this.tableName} ( password, name, email, phone, avatar, active, created_at , updated_at, seller_id, text_password, created_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [
                hashedPassword,
                model.name,
                model.email,
                model.phone,
                pathAvatar || null,
                model.active || 1,
                created_at,
                updated_at,
                model.seller_id || 0,
                model.text_password || null,
                model.created_id || null
            ]
            const result = await database.executeQuery(query, values);
            let id = (result as mysql.ResultSetHeader).insertId
            const userRole = {
                created_id: id,
                role_id: model.role_id || 1,
                user_id: id,
                seller_id: model.seller_id || 0
            }
            const resultRole = await this.userRole.create(userRole)
            if (resultRole instanceof HttpException)
                return new HttpException(400, errorMessages.CREATE_ROLE_FAILED);
            delete (model as RowDataPacket).password;
            return {
                data: {
                    id: id,
                    ...model,
                    avatar: pathAvatar,
                    userRole: (resultRole.data) ? resultRole.data : null,
                    created_at: created_at,
                    updated_at: updated_at,
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.CREATE_FAILED);
        }
    }
    public delete = async (id: number) => {
        const checkId = await checkExist(this.tableName, 'id', id.toString());
        if (!checkId)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        let phone = (checkId as RowDataPacket[])[0].phone;
        const userDir = path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, phone);
        if (fs.existsSync(userDir)) {
            fs.rmdirSync(userDir, { recursive: true });
        }
        const result = await database.executeQuery(`delete from users where id = ?`, [id]);
        if ((result as any).affectedRows === 0)
            return new HttpException(400, errorMessages.DELETE_FAILED);
        return {
            data: {
                message: errorMessages.DELETE_SUCCESS,
                id: id
            }
        }
    }
    public getOne = async (id: number, seller_id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const branchId = await this.employeeBranch.getByUserId(id, seller_id) as any
        delete (result as RowDataPacket[])[0].password;
        delete (result as RowDataPacket[])[0].token;

        const getRole = await this.userRole.findByUserId(id);
        //console.log("getRole", getRole);

        if (getRole instanceof HttpException) {

        } else {
            return {
                data: {
                    ...(result as RowDataPacket[])[0],
                    role_id: (getRole as RowDataPacket).data[0].role_id,
                    branch_id: branchId.data
                }
            }
        }
        return {
            data: {
                ...(result as RowDataPacket[])[0]
            }
        };


    }

    public searchs = async (key: string, name: string, phone: string, email: string, pageInt: number, limitInt: number, active: number, seller_id: number, created_id: number) => {
        let query = `select * from ${this.tableName} where 1=1`;
        let countQuery = `SELECT COUNT(*) as total FROM ${this.tableName} WHERE 1=1`;

        if (key && key.length != 0) {
            query += ` and (name like '%${key}%' or phone like '%${key}%' or email like '%${key}%')`
            countQuery += ` and (name like '%${key}%' or phone like '%${key}%' or email like '%${key}%')`
        }
        if (name && name.length != 0) {
            query += ` and name like '%${name}%'`
            countQuery += ` and name like '%${name}%'`
        }
        if (phone && phone.length != 0) {
            query += ` and phone like '%${phone}%'`
            countQuery += ` and phone like '%${phone}%'`
        }
        if (email && email.length != 0) {
            query += ` and email like '%${email}%'`
            countQuery += ` and email like '%${email}%'`
        }
        if (active && active.toString().length > 0) {
            query += ` and active = ${active}`
            countQuery += ` and active = ${active}`
        }
        if (seller_id != undefined) {
            query += ` and seller_id = ${seller_id}`
            countQuery += ` and seller_id = ${seller_id}`
        }
        query += `  or created_id = ${created_id} `
        countQuery += ` or created_id = ${created_id} `
        query += ` order by id desc`
        if (pageInt && pageInt < 1 || pageInt && limitInt < 1)
            return new HttpException(400, errorMessages.INVALID_PAGE_LIMIT);
        if (pageInt && limitInt) {
            query = query + ` LIMIT ` + limitInt + ` OFFSET ` + (pageInt - 1) * limitInt;
        }

        let pagination: IPagiantion = {
            page: pageInt,
            limit: limitInt,
            totalPage: 0
        }
        //console.log(query)
        const count = await database.executeQuery(countQuery);
        const totalPages = Math.ceil((count as RowDataPacket[])[0].total / limitInt);
        if (Array.isArray(count) && count.length > 0)
            pagination.totalPage = totalPages

        const result = await database.executeQuery(query);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.FIND_ALL_FAILED);
        await Promise.all((result as RowDataPacket[]).map(async (row: any) => {
            delete row.password;
            delete row.token;
        }));
        for (let i = 0; i < (result as RowDataPacket[]).length; i++) {
            const getRole = await this.userRole.findByUserId((result as RowDataPacket[])[i].id);
            if (getRole instanceof HttpException) {
            } else {
                // (result as RowDataPacket[])[i].role_id = (getRole as RowDataPacket).data[0].role_id
                let query = `select * from role where id = ?`
                const role = await database.executeQuery(query, [(getRole as RowDataPacket).data[0].role_id]);
                //console.log("role", role);
                if (role instanceof HttpException) {
                } else {
                    (result as RowDataPacket[])[i].role = (role as RowDataPacket)[0].name
                }
            }
        }
        return {
            data: result,
            pagination: pagination
        }
    }
    public statistics = async (seller_id: number) => {
        let countQuery = `SELECT 
            COUNT(CASE WHEN active = 1 THEN 1 END) AS totalactive,
            COUNT(CASE WHEN active = 0 THEN 1 END) AS totalUnactive,
            COUNT(*) AS total
        FROM ${this.tableName} WHERE 1=1`;
        if (seller_id != undefined) {
            countQuery += ` and seller_id = ${seller_id}`
        }
        const result = await database.executeQuery(countQuery);
        return {
            data: (result as RowDataPacket[])[0]
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
    public updateListActive = async (data: number[], active: number) => {
        try {
            let result = null;
            const update_at = new Date()
            let query = `update ${this.tableName} set active = ?, updated_at = ? where id in (${data})`
            result = await database.executeQuery(query, [active, update_at]);
            return {
                data: {
                    active: active,
                    updated_at: update_at
                }
            }
        }
        catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public updateProfile = async (model: CreateDto, id: number, avatar: any) => {
        console.log(model, id, avatar);
        const check = await checkExist(this.tableName, 'id', id);
        let pathAvatar;
        if (check == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');

        if (avatar) {
            const upload = await this.uploadImage((check as RowDataPacket)[0].phone.toString(), avatar)
            if (upload instanceof HttpException)
                return upload;
            pathAvatar = upload as string;
        }
        if (model.branch_id && model.branch_id.length > 0) {
            const deleteBranch = await this.employeeBranch.deleteRows(model.branch_id)
            if (deleteBranch instanceof HttpException)
                return deleteBranch
            if (model.branch_id.includes(0)) {
                const employeeBranch = {
                    seller_id: model.seller_id,
                    branch_id: 0,
                    user_id: id
                }
                await this.employeeBranch.create(employeeBranch)
            }
            else {
                for (const element of model.branch_id) {
                    const employeeBranch = {
                        seller_id: model.seller_id,
                        branch_id: element,
                        user_id: id
                    }
                    await this.employeeBranch.create(employeeBranch)
                }
            }
        }
        console.log(model.active);
        let query = `UPDATE ${this.tableName} SET `;
        let values = [];
        if (model.email != undefined) {
            query += `email = ?,`
            values.push(model.email)
        }
        if (model.name != undefined) {
            query += `name = ?,`
            values.push(model.name)
        }
        if (model.phone != undefined) {
            const checkPhoneUnique = await checkExist(this.tableName, 'phone', model.phone, id);
            if (checkPhoneUnique) {
                return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
            }
            query += `phone = ?,`
            values.push(model.phone);
        }
        if (pathAvatar != undefined) {
            query += `avatar = ?,`
            values.push(pathAvatar)
        }
        if (model.active && model.active.toString().length > 0) {
            query += `active = ?,`
            values.push(model.active)
        }
        // if (model.role_id != undefined) {
        //     const userRole = await this.userRole.findByUserId(id);
        //     //console.log("userRole", userRole);
        //     if (userRole instanceof HttpException && userRole.field) {
        //         //console.log(2);
        //         model.created_id = id;
        //         model.role_id = model.role_id;
        //         model.user_id = id;
        //         const createRole = await this.userRole.create(model)
        //         if (createRole instanceof HttpException)
        //             return new HttpException(400, errorMessages.CREATE_ROLE_FAILED);
        //     }
        //     if ((userRole as RowDataPacket).data.length > 0) {
        //         for (let i = 0; i < (userRole as RowDataPacket).data.length; i++) {
        //             await this.userRole.delete((userRole as RowDataPacket).data[i].id)
        //         }
        //         const createRole = await this.userRole.create(model)
        //         if (createRole instanceof HttpException)
        //             return new HttpException(400, errorMessages.CREATE_ROLE_FAILED);
        //     }
        // }
        const updated_at = new Date();
        query += `updated_at = ? WHERE id = ?`
        values.push(updated_at)
        values.push(id)
        try {
            const result = await database.executeQuery(query, values);
            if ((result as mysql.ResultSetHeader).affectedRows == 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            if (model.role_id) {
                const updateRole = await database.executeQuery(`update user_role set role_id = ${model.role_id} where user_id = ${id}`)
            }
            if (pathAvatar) {
                const userDir = path.join(__dirname, process.env.USER_UPLOAD_IMAGE_PATH as string, (check as RowDataPacket)[0].phone.toString());
                if (fs.existsSync(userDir)) {
                    fs.rmdirSync(userDir, { recursive: true });
                }
            }
            return {
                data: {
                    id: id,
                    ...model,
                    avatar: pathAvatar,
                    updated_at: updated_at
                }
            }
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }

    }
    public getProfileById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        delete (result as RowDataPacket[])[0].password;
        delete (result as RowDataPacket[])[0].text_password;
        delete result[0].token;
        // role id 
        const getRole = await this.userRole.findByUserId(id);
        if (getRole instanceof HttpException) {
        } else {
            return {
                data: {
                    ...(result as RowDataPacket[])[0],
                    role_id: (getRole as RowDataPacket).data[0].role_id
                }
            }
        }
    }
    public saveDeviceToken = async (id: number, token: string) => {
        const check = await checkExist(this.tableName, 'id', id.toString());
        if (check === false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        const checkToken = await checkExist('device_token', 'user_id', id.toString());
        if (Array.isArray(checkToken) && checkToken.length > 0 && id == (checkToken as RowDataPacket[])[0].user_id) {
            let queryUpdate = `update device_token set token = ?, updated_at = ? where user_id = ?`
            const resultUpdate = await database.executeQuery(queryUpdate, [token, new Date(), id]);
            if ((resultUpdate as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
        } else {
            let query = "insert into device_token (token, user_id) values (?, ?)"
            const result = await database.executeQuery(query, [token, id]);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
        }
        return {
            data: {
                id: id,
                token: token
            }
        }
    }
    public getUserByRoleId = async (id: number, url: string, action: string) => {
        console.log(id, url, action);
        try {
            const permission = await this.permissionService.checkPermissionUserId(id, url, action);
            if (!permission) {
                return {
                    data: false
                }
            }
            return {
                data: true
            }
        } catch (error) {
            return {
                data: false
            }
        }
    }
}

export default UserServices;