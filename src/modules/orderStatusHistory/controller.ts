import { sendResponse } from "@core/utils";
import OrderStatusService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class OrderStatusController {
    public service = new OrderStatusService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model = req.body;
        model.user_id = req.id;
        model.seller_id = req.seller_id;
        try {
            const result = await this.service.create(model);
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
                return sendResponse(res, result.status, result.message as string);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.delete(id);
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
        const publish = req.query.publish as any;

        const page = req.query.page as any;
        const limit = req.query.limit as any;

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        try {
            const result = await this.service.searchs(key, name, publish, pageInt, limitInt);
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
            const result = await this.service.updateStatus(id);
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
            const result = await this.service.updateListStatus(listId, publish);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findOrderDetailByOrderId = async (req: Request, res: Response, next: NextFunction) => {
        const orderId: number = req.params.orderId as any;
        try {
            const result = await this.service.findOrderStatusByOrderId(orderId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findOrderStatusLastestByOrderId = async (req: Request, res: Response, next: NextFunction) => {
        const orderId: number = req.params.orderId as any;
        try {
            const result = await this.service.findOrderStatusLastestByOrderId(orderId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public findAllOrderStatusByOrderId = async (req: Request, res: Response, next: NextFunction) => {
        const orderId: number = req.params.orderId as any;
        try {
            const result = await this.service.findAllOrderStatusByOrderId(orderId);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
        const order_id: number = req.params.orderId as any;
        const status: number = req.body.status;
        const user_id = req.id;
        
        try {
            const result = await this.service.updateOrderStatus(order_id, user_id as number, status as number);
            if (result instanceof Error) {
                return sendResponse(res, result.status, result.message);
            }
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}