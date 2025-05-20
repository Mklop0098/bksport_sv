import { sendResponse } from "@core/utils";
import CustomerGroupService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class CustomerGroupController {
    public service = new CustomerGroupService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model = req.body;
        model.created_id = req.id;
        model.seller_id = req.seller_id;
        try {
            const result = await this.service.create(model);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        model.seller_id = req.seller_id
        const id: number = req.params.id as any;
        try {
            const result = await this.service.update(model, id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
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
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
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
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const publish = req.query.publish as any;
        const code: string = req.query.code as any;
        const is_default: boolean = req.query.is_default as any;

        const page = req.query.page as any;
        const limit = req.query.limit as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        const seller_id = req.seller_id as any;
        try {
            const result = await this.service.searchs(key, name, publish, pageInt, limitInt, code, is_default, seller_id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.updatePublish(id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
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
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListPublish = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const publish: number = req.body.publish;
        try {
            const result = await this.service.updateListPublish(listId, publish);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateIsDefault = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.updateDefault(model, id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
}