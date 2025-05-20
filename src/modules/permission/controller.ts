import { sendResponse } from "@core/utils";
import PermissionService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import { EAction } from "./interface";

export class PermissionController {
    public service = new PermissionService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.create(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public createAndUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const model = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.createAndUpdate(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.delete(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.findById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const status = req.query.status as any;
        const Permission_id: number = req.query.Permission_id as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const action: string = req.query.action as any;
        const role_id: number = req.query.role_id as any;
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.searchs(key, name, status, pageInt, limitInt, Permission_id, action, role_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatestatus = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.updateStatus(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        try {
            const result = await this.service.deleteRows(listId);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListstatus = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const status: number = req.body.status;
        try {
            const result = await this.service.updateListStatus(listId, status);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public findPermissionOfUserId = async (req: Request, res: Response, next: NextFunction) => {
        const user_id: number = req.params.id as any;
        try {
            const result = await this.service.findPermissionOfUserId(user_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public checkPermissionByUserId = async (req: Request, res: Response, next: NextFunction) => {
        const user_id: number = req.id as any;
        const action: string = req.query.action as any;
        const url: string = req.query.url as any;
        const role_id: number = req.role_id as any;
       //console.log(role_id, url, action)
        //console.log("user_id", user_id);
        //console.log("action", action);
        //console.log("module_id", module_id);
        //console.log("role_id", role_id);
        
        if (!action || !url || !role_id) {
            return sendResponse(res, 403, message.PERMISSION_DENIED, false);
        }
        try {
            const result = await this.service.checkPermissionByUserIdUpdate(role_id, url, action);
            //console.log("result", result);

            if (!result) {
                return sendResponse(res, 403, message.PERMISSION_DENIED, false);
            } else {
                return sendResponse(res, 200, message.PERMISSION_GRANTED, true);
            }
        } catch (error) {
            next(error);
        }
    }

    public findAll = async (req: Request, res: Response, next: NextFunction) => {
        const role_id: number = req.params.id as any;
        try {
            const result = await this.service.findAll(role_id);
            // if (result instanceof Error)
            // return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    //sua
    public findAllPermissionByRoleId = async (req: Request, res: Response, next: NextFunction) => {
        const role_id: number = req.params.id as any;
        try {
            const result = await this.service.findAllPermissionByRoleId(role_id);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}