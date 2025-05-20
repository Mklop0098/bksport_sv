import { Request, Response, NextFunction } from "express";
import SupplierService from "./service";
import { sendResponse } from "@core/utils";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

class SupplierController {
    public service = new SupplierService();

    public create = async (req: Request, res: Response, next: NextFunction) => {
        const customerDto: CreateDto = req.body;
        try {
            const model = customerDto as any;
            model.created_id = req.id
            model.seller_id = req.seller_id
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
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.delete(model, id);
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
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;
        const product_id: number = req.query.product_id as any;
        const supplier_id: number = req.query.supplier_id as any;
        const branch_id: number = req.query.branch_id as any;
        const quantity: number = req.query.quantity as any;
        const status = req.query.status as any;
        const page = req.query.page as any
        const limit = req.query.limit as any

        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)
        const seller_id = req.seller_id as any;
        try {
            const result = await this.service.searchs(key, product_id, supplier_id, branch_id, quantity, status, pageInt, limitInt, seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const customerDto: CreateDto = req.body;
        const id: number = req.params.id as any;
        try {
            const model = customerDto as any;
            model.created_id = req.id;
            const result = await this.service.updateProfile(model, id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.updateStatus(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public statistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.statistics();
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        try {
            const result = await this.service.deleteRows(listId);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListSublish = async (req: Request, res: Response, next: NextFunction) => {
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
}
export default SupplierController;