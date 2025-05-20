import UserServices from "./user.service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { Create } from "./dtos/create.dto";
import { CreateDto } from "./dtos/update.dto";
import message from "@core/config/constants";

class UserController {
    public userServices = new UserServices();
    public updateActive = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.updateActive(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: Create = req.body as Create;
        const avatar = req.file;
        model.created_id = req.id;
        model.seller_id = req.seller_id
       //console.log("created_id", req.id)
        try {
            const result = await this.userServices.create(model, avatar);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.delete(id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getOne = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const seller_id = req.seller_id as any;
        try {
            const result = await this.userServices.getOne(id, seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;
        const name: string = req.query.name as any;
        const phone: string = req.query.phone as any;
        const email: string = req.query.email as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const active = req.query.active as any;
        const seller_id = req.seller_id as any;
        const created_id = req.id as any;
       //console.log(req.seller_id, req.id)
        let pageInt = parseInt(page as any);
        let limitInt = parseInt(limit as any);

        try {
            const result = await this.userServices.searchs(key, name, phone, email, pageInt, limitInt, active, seller_id, created_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public statistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const seller_id = req.seller_id as any;
            const result = await this.userServices.statistics(seller_id);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        try {
            const result = await this.userServices.deleteRows(listId);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListActive = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const active: number = req.body.active;
        try {
            const result = await this.userServices.updateListActive(listId, active);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body as CreateDto;
        const id: number = req.id as any;
        const avatar = req.file;
        try {
            const result = await this.userServices.updateProfile(model, id, avatar);
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getProfileById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any
        try {
            const result = await this.userServices.getProfileById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public saveDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any;
        const token: string = req.body.token as any;
        try {
            const result = await this.userServices.saveDeviceToken(id, token);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getUserByRoleId = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any;
        const url: string = req.query.url as any;
        const action: string = req.query.action as any;
        try {
            const result = await this.userServices.getUserByRoleId(id, url, action);
            return sendResponse(res, 200, message.CHECK_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default UserController;