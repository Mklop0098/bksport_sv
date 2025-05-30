import { sendResponse } from "@core/utils";
import ProductCommissionService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class ProductCommissionController {
    public service = new ProductCommissionService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model = req.body;
        model.created_id = req.id;
        model.seller_id = req.seller_id;
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
    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        const id: number = req.params.id as any;
        try {
            const result = await this.service.update(model, id);
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
        const product_id: number = req.query.product_id as any;
        const key: string = req.query.key as any;
        const publish = req.query.publish as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const commission: number = req.query.commission as any;
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        const seller_id = req.seller_id as any;
        try {
            const result = await this.service.searchs(key, product_id, publish, pageInt, limitInt, commission, seller_id);
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
    public importExcel = async (req: Request, res: Response, next: NextFunction) => {
        const file = req.file;
        const created_id = req.id;
        try {
            const result = await this.service.importExcel(file, created_id as number);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if ((result as any).message.includes(message.MAX_ROW_EXCEL)) {
                return sendResponse(res, 400, (result as any).message);
            }
            return sendResponse(res, 200, message.IMPORT_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}