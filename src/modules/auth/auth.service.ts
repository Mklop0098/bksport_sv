import { isEmptyObject } from "@core/utils/helpers";
import { HttpException } from "@core/exceptions";
import bcryptjs from 'bcryptjs';
import database from "@core/config/database";
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import LoginDto from "./dtos/login.dto";
import jwt, { JwtPayload } from 'jsonwebtoken';
import { RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import changePasseword from "./dtos/changePassword.dto";
import UpdateProfileDao from "./dtos/updateProfile.dto";
import { checkExist } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import Ilog from "@core/interfaces/log.interface";

class AuthServices {
    private tableName = 'users';
    private tableToken = 'token';
    private moduleId = 4;
    
    public checkLoginUser = async (model: LoginDto) => {
        console.log(model);
        if (isEmptyObject(model))
            return errorMessages.MODEL_IS_EMPTY;
        const user = await checkExist(this.tableName, 'phone', model.phone.toString());
        console.log(user)
        if (user == false)
            return errorMessages.PHONE_NOT_EXISTED

        if (!user[0].created_id) {
            const getRoleQuery = `SELECT role_id FROM user_role WHERE user_id = ?`
            const role = await database.executeQuery(getRoleQuery, [user[0].id]) as RowDataPacket
            console.log(role)
            const getSellerActive = `SELECT active FROM seller WHERE id = ?`
            if (user[0].seller_id < 1 || role[0].id === 4) {
                return errorMessages.ACCESS_DENIED
            } 
            else {
                const active = await database.executeQuery(getSellerActive, [user[0].seller_id]) as RowDataPacket
                if (active.length < 1) {
                    return errorMessages.ACCESS_DENIED
                }
                if (active[0].active !== 1) {
                    return errorMessages.ACCOUNT_NOT_ACTIVE
                }
            }
            if ((user as RowDataPacket[])[0].active == 0) {
                return errorMessages.USER_BLOCKED
            }
        }
        return ""
    }

    public login = async (model: LoginDto) => {
        try {
            const check = await this.checkLoginUser(model)
            if (check !== "") return new HttpException(400, check);
            const user = await checkExist(this.tableName, 'phone', model.phone);
            const validPassword = user && await bcryptjs.compare(model.password, (user as any)[0].password);
            if (!validPassword)
                return new HttpException(400, errorMessages.PASSWORD_INCORRECT, 'password');
            let id = (user as RowDataPacket[])[0].id;
            
            const accessToken = jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES_IN });
            const refreshToken = jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN });

            let query = `insert into ${this.tableToken} (token, user_id) values (?, ?)`;
            await database.executeQuery(query, [refreshToken, id]);
            if (Array.isArray(user) && user.length === 0)
                return new HttpException(404, errorMessages.PHONE_NOT_EXISTED, 'phone');

            //log
            let log: Ilog = {
                user_id: id,
                action: 'login',
                module_id: this.moduleId,
                des: { id: id, ...model }
            }

            return {
                data: {
                    user: {
                        ...(user as RowDataPacket[])[0]
                    },
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            }

        } catch (error) {
            return error;
        }
    }
    public changePassword = async (model: changePasseword) => {
        try {
            const user = await checkExist(this.tableName, 'id', model.id?.toString() ?? '');
            if (user == false)
                return new HttpException(404, errorMessages.NOT_EXISTED, 'id');
            const validPassword = user && await bcryptjs.compare(model.password, (user as any)[0].password);
            if (!validPassword)
                return new HttpException(400, errorMessages.PASSWORD_INCORRECT, 'password');
            const hashedNewPassword = await bcryptjs.hash(model.newPassword, 10);
            const result = await database.executeQuery(`UPDATE ${this.tableName} SET password = ? WHERE id = ?`, [hashedNewPassword, model.id]);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            if ((result as mysql.ResultSetHeader).affectedRows > 0)
                return
        } catch (error) {
            return new HttpException(500, errorMessages.UPDATE_FAILED);
        }
    }
    public async logout(refreshToken: string) {
        const checkToken = await database.executeQuery(`select * from ${this.tableToken} where token = ?`, [refreshToken]);
        //console.log("checkToken", checkToken);

        const result = await database.executeQuery(`delete from ${this.tableToken} where token = ?`, [refreshToken]);
        if ((result as mysql.ResultSetHeader).affectedRows === 0)
            return new HttpException(400, errorMessages.LOGOUT_FAILED);
        // delete device token
        await database.executeQuery(`delete from device_token where user_id = ?`, [(checkToken as RowDataPacket)[0].user_id]);

        await database.log({
            user_id: (checkToken as RowDataPacket)[0].user_id,
            action: 'logout',
            module_id: this.moduleId,
            des: { id: (checkToken as RowDataPacket)[0].user_id, token: refreshToken }
        })
        return
    }
    private createFolderIfNotExist(dir: string) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
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
    public updateProfile = async (model: UpdateProfileDao, id: number, avatar: any) => {
        const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!imageMimeTypes.includes(avatar.mimetype)) {
            return new HttpException(400, errorMessages.INVALID_FILE);
        }
        let query = ''
        if (avatar == undefined) {
            const checkAvt = await database.executeQuery('select avatar from users where id = ?', [id]);
            if ((checkAvt as RowDataPacket[])[0].avatar == null)
                return new HttpException(404, errorMessages.AVATAR_NOT_EXISTED);
            query = `UPDATE ${this.tableName}  SET phone = ?, email = ?, name = ?, active = ? , updated_at = ? WHERE id = ?`
            const update_at = new Date()
            const result = await database.executeQuery(query, [model.phone, model.email, model.name, model.active, update_at, id]);
            if ((result as mysql.ResultSetHeader).affectedRows === 0)
                return new HttpException(400, errorMessages.UPDATE_FAILED);
            return {
                data: {
                    id,
                    ...model,
                    updated_at: update_at
                }
            }
        }
        const user = await checkExist(this.tableName, 'id', id.toString());
        if (user == false)
            return new HttpException(404, errorMessages.PHONE_NOT_EXISTED, 'id');
        if (await checkExist(this.tableName, 'email', model.email, id.toString()))
            return new HttpException(400, errorMessages.EMAIL_EXISTED, 'email');
        if (await checkExist(this.tableName, 'phone', model.phone, id.toString()))
            return new HttpException(400, errorMessages.PHONE_EXISTED, 'phone');
        let phone = (user as RowDataPacket[])[0].phone;
        const upload = await this.uploadImage(phone.toString(), avatar);
        if (upload instanceof HttpException)
            return upload
        else {
            let pathAvatar = upload as string;
            try {
                if (isEmptyObject(model))
                    return new HttpException(400, errorMessages.MODEL_IS_EMPTY);
                const update_at = new Date()
                const result = await database.executeQuery(`UPDATE ${this.tableName}  SET phone = ?, email = ?, name = ?, avatar = ?, active = ? , updated_at = ? WHERE id = ?`, [model.phone, model.email, model.name, pathAvatar, model.active ? 1 : 0, update_at, id]);
                if ((result as mysql.ResultSetHeader).affectedRows === 0)
                    return new HttpException(400, errorMessages.UPDATE_FAILED);
                return {
                    data: {
                        id,
                        ...model,
                        avatar: pathAvatar,
                        updated_at: update_at
                    }
                }
            } catch (error) {
                return new HttpException(500, errorMessages.UPDATE_FAILED);
            }
        }
    }
    public refreshToken = async (refreshToken: string) => {
        try {
            const query = `SELECT * FROM ${this.tableToken} WHERE token = ?`;
            const result = await database.executeQuery(query, [refreshToken]);
            if ((result as RowDataPacket[]).length === 0)
                return new HttpException(400, errorMessages.REFRESH_TOKEN_FAILED);
            else {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string) as JwtPayload
                if (!decoded)
                    return new HttpException(400, errorMessages.REFRESH_TOKEN_FAILED);
                const id = decoded.id;
                const accessToken = jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES_IN });
                return {
                    data: {
                        accessToken: accessToken
                    }
                }
            }
        } catch (error) {
            await database.executeQuery(`delete from ${this.tableToken} where token = ?`, [refreshToken]);
            return new HttpException(500, errorMessages.REFRESH_TOKEN_FAILED);
        }
    }
    public getProfileById = async (id: number) => {
        const result = await checkExist(this.tableName, 'id', id.toString());
        if (result == false)
            return new HttpException(404, errorMessages.NOT_FOUND, 'id');
        return {
            data: (result as RowDataPacket[])[0]
        };
    }
    public checkAdmin = async (id: number) => {
        //check tam thoi
        let isAdmin: boolean = false;
        const result = await database.executeQuery(`select * from ${this.tableName} where id = ?`, [id]);
        //console.log("result", result);
        if (Array.isArray(result) && result.length === 0)
            return new HttpException(400, errorMessages.NOT_ADMIN);
        if ((result as RowDataPacket)[0].id == 1)
            isAdmin = true;
        return {
            data: isAdmin
        }
    }
}

export default AuthServices;