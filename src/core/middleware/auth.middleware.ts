import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sendResponse } from '@core/utils';
import { checkExist } from '@core/utils/checkExist';
import errorMessages from '@core/config/constants';
import PermissionService from '@modules/permission/service';
import ModuleService from '@modules/module/service';
import { ur } from '@faker-js/faker';
class AuthMiddleware {
    public static authorization(isCheckPermission = false) {
        if (isCheckPermission == false) {
            return this.authorizationWithPermissionCheck(false);
        } else {
            return this.authorizationWithPermissionCheck(true);
        }
    }
    public static authorizationWithPermissionCheck = (isCheckPermission: boolean) => {
        const moduleService = new ModuleService()
        return async (req: Request, res: Response, next: NextFunction) => {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            // //console.log(req.header('Authorization') + 'optech');
            if (!token) {
                return sendResponse(res, 401, 'token is required');
            }
            const url: string = req.header("url") as string;
            const action: string = req.header("action") as string;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
                if (decoded && typeof decoded === 'object' && 'id' in decoded) {
                    const check = await checkExist('users', 'id', decoded.id.toString());
                    if (!check) {
                        return sendResponse(res, 401, 'user not found');
                    }
                    if (check[0].active === 0) {
                        return sendResponse(res, 423, errorMessages.USER_BLOCKED);
                    }
                    req.id = check[0].id;
                    req.seller_id = check[0].seller_id;
                    const getRole = await checkExist('user_role', 'user_id', decoded.id.toString());
                    if (getRole == false) {
                    } else {
                        req.role_id = getRole[0].role_id;
                    }
                    if (isCheckPermission == true) {
                        const permissionService = new PermissionService();
                        const permission = await permissionService.checkPermissionUserId(decoded.id, url, action);
                        if (!permission) {
                            if (action === 'index') {
                                return sendResponse(res, 403, errorMessages.PERMISSION_DENIED);
                            }
                            return sendResponse(res, 403, 'Bạn không có quyền thực hiện thao tác này');
                            
                        }
                    }
                    next();
                } else {
                    return sendResponse(res, 403, 'invalid token');
                }
            } catch (error) {
                return sendResponse(res, 401, error instanceof Error ? error.message : 'token verification failed');
            }
        };
    };


    public static checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
        if (req.id !== 1) {
            return sendResponse(res, 400, 'Bạn không có quyền thực hiện thao tác này', null, 'id');
        }
        next()
    }

    public static authorizationAdmin = () => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const token = req.header('Authorization')?.replace('Bearer ', '');
           //console.log(typeof token)
            if (token && token !== 'null') {
                const module_id: number = parseInt(req.header("module_id") as string);
                const action: string = req.header("action") as string;
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
                    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
                        const check = await checkExist('users', 'id', decoded.id.toString());
                        if (!check) {
                            return sendResponse(res, 401, 'user not found');
                        }
                        if (check[0].active === 0) {
                            return sendResponse(res, 423, errorMessages.USER_BLOCKED);
                        }
                        const getRole = await checkExist('user_role', 'user_id', decoded.id.toString());
                        if (getRole && getRole[0].role_id === 1 ) {
                            req.role_id = getRole[0].role_id;
                            next();
                        }
                        else {
                            return sendResponse(res, 403, "Bạn không có quyền thực hiện thao tác này");
                        }
                    } else {
                        return sendResponse(res, 403, 'invalid token');
                    }
                } catch (error) {
                    return sendResponse(res, 401, error instanceof Error ? error.message : 'token verification failed');
                }
            }
            else {
                req.role_id = 0
                next();
            }
        };
    };
    public static authorizationToCreateUser = () => {
        const moduleService = new ModuleService()
        return async (req: Request, res: Response, next: NextFunction) => {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (token && token !== 'null') {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
                    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
                        const check = await checkExist('users', 'id', decoded.id.toString());
                        if (!check) {
                            return sendResponse(res, 401, 'user not found');
                        }
                        if (check[0].active === 0) {
                            return sendResponse(res, 423, errorMessages.USER_BLOCKED);
                        }
                        req.id = check[0].id;
                        req.seller_id = check[0].seller_id;
                        next();

                    } else {
                        return sendResponse(res, 403, 'invalid token');
                    }
                } catch (error) {
                    return sendResponse(res, 401, error instanceof Error ? error.message : 'token verification failed');
                }
            }
            else {
                next();
            }
        };
    };

}

export default AuthMiddleware;
