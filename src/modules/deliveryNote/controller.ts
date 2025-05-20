import { sendResponse } from "@core/utils";
import DeliveryNoteService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import { ISearch } from "./interface";

export class DeliveryNoteController {
    public service = new DeliveryNoteService();
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
        model.created_id = req.id
        model.seller_id = req.seller_id
        try {
            const result = await this.service.update(id, model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            if (result.data.status && result.data.status == 400) {
                return sendResponse(res, 400, message.UPDATE_FAILED, {errors: result.data.errors});
            }
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
        const {publish, fromDate, toDate, branch_id, status} = req.query as any;
        const seller_id = req.seller_id as number

        const page = req.query.page as any;
        const limit = req.query.limit as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        const user_id = req.id as number
        try {
            const result = await this.service.searchs(key, name, publish, pageInt, limitInt, fromDate, toDate, branch_id, seller_id, status, user_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListPublish = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const status: string = req.body.status;
        const created_id = req.id as number 
        const seller_id = req.seller_id as number
        const is_delivery = req.body.is_delivery
        try {
            const result = await this.service.updateListStatus(listId, status, created_id, seller_id, is_delivery);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportDeliveryNote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.reportDeliveryNote();
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public reportDeliveryNoteByCreatedAt = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const fromDate: string = req.query.fromDate as any;
            const toDate: string = req.query.toDate as any;
            const date: string = req.query.date as any;
            const page = req.query.page as any;
            const limit = req.query.limit as any;
            parseInt(page as any)
            parseInt(limit as any)
            let model: ISearch = {
                fromDate, toDate, date, page, limit
            }
            const seller_id = req.seller_id as any;
            model.seller_id = seller_id;
            const result = await this.service.reportDeliveryNoteByCreatedAt(model);
            if(result instanceof Error && result.field)
                return sendResponse(res, 400, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result.data);
        } catch (error) {
            next(error);
        }
    }
    public reportListDelivery = async (req: Request, res: Response, next: NextFunction) => {
        const listId = req.body.listId;
        let model: any = {
            listId: listId
        }
        try {
            const result = await this.service.reportListDelivery(model);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result.data);
        } catch (error) {
            next(error);
        }
    }

    public updateDelivery = async (req: Request, res: Response, next: NextFunction) => {
        const order_id: number = req.body.order_id;
        const status: number = req.body.status;
        const seller_id: number = req.body.user_id;
        try {
            const result = await this.service.updateDelivery(order_id, status, seller_id)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

}