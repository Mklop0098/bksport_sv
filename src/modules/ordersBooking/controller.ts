import { sendResponse } from "@core/utils";
import OrdersBookingService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class OrdersBookingController {
    public service = new OrdersBookingService();

    public getAllOrdersBooking = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllOrdersBooking(id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        model.created_id = req.id
        model.seller_id = req.seller_id
        try {
            const result = await this.service.create(model) 
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);  
        } catch (error) {
            next(error)
        }
    }   

    public search = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id: number = req.seller_id as any
        const page: number = req.query.page as any  
        const limit: number = req.query.limit as any
        try {
            const result = await this.service.search(seller_id, page, limit)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }   

    public updateListStatus = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId
        const status: number = req.body.status
        try {
            const result = await this.service.updateListStatus(listId, status)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

    public updateStatusPayment = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.updateStatusPayment(id)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }   

    public findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.findById(id)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        const id: number = req.params.id as any
        model.created_id = req.id
        model.seller_id = req.seller_id
        try {
            const result = await this.service.update(model, id)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

}