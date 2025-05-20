import AuthServices from "./auth.service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import LoginDto from "./dtos/login.dto";
import changePasseword from "./dtos/changePassword.dto";
import UpdateProfileDao from "./dtos/updateProfile.dto";
import message from "@core/config/constants";
import { checkExist } from "@core/utils/checkExist";
import { JwtPayload } from "jsonwebtoken";
import errorMessages from "@core/config/constants";
import jwt from 'jsonwebtoken';

class AuthController {
    public authServices = new AuthServices();

    public login = async (req: Request, res: Response, next: NextFunction) => {
        const model: LoginDto = req.body as LoginDto;
        try {
            const result = await this.authServices.login(model);
            // //console.log(result);
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.LOGIN_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public changePassword = async (req: Request, res: Response, next: NextFunction) => {
        const model: changePasseword = req.body as changePasseword;
        model.id = req.id;
        try {
            const result = await this.authServices.changePassword(model);
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.CHANGE_PASSWORD_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public logout = async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken: string = req.body.refreshToken;
        try {
            const result = await this.authServices.logout(refreshToken);
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error) {
                return sendResponse(res, result.status, result.message);
            }
            return sendResponse(res, 200, message.LOGOUT_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const model: UpdateProfileDao = req.body as UpdateProfileDao;
        const id: number = req.params.id as any;
        const avatar = req.file;
        try {
            const result = await this.authServices.updateProfile(model, id, avatar);
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        const refreshToken: string = req.body.refreshToken;
        try {
            const result = await this.authServices.refreshToken(refreshToken);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.REFRESH_TOKEN_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getProfileById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any
        try {
            const result = await this.authServices.getProfileById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public checkAmin = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any;
        const result = await this.authServices.checkAdmin(id);
        if (result instanceof Error && result.field)
            return sendResponse(res, result.status, result.message, null, result.field);
        if (result instanceof Error)
            return sendResponse(res, result.status, result.message);
        return sendResponse(res, 200, message.CHECK_SUCCESS, result);
    }
    public checkToken = async (req: Request, res: Response, next: NextFunction) => {
        const data: any = {}
        const token = req.body.token
       //console.log(token)
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        if (decoded && typeof decoded === 'object' && 'id' in decoded) {
            const check = await checkExist('users', 'id', decoded.id.toString());
            if (!check) {
                return sendResponse(res, 401, errorMessages.USER_NOT_EXISTED);
            }
            if (check[0].active === 0) {
                return sendResponse(res, 423, errorMessages.USER_BLOCKED);
            }
            data.id = check[0].id;
            data.seller_id = check[0].seller_id;
            data.name = check[0].name
            const getRole = await checkExist('user_role', 'user_id', decoded.id.toString());
            if (getRole == false) {
            } else {
                data.role_id = getRole[0].role_id;
            }
           //console.log(data)
            return sendResponse(res, 200, message.CHECK_SUCCESS, data);
        }
    }
}
export default AuthController;