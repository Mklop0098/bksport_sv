import { sendResponse } from "@core/utils";
import AdminResetService from "./service";
import { Request, Response, NextFunction } from "express";
import message from "@core/config/constants";

export class AdminResetController {
    public service = new AdminResetService();

    public resetProductBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const sellerId = req.seller_id as any;
        try {
            const result = await this.service.resetProductBySellerId(sellerId)
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error);
        }

    }

    public resetOrderBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const sellerId = req.seller_id as any;
        const condition = req.query.condition as any;
        const branchId = req.query.branch_id as any;
        try {
            const result = await this.service.resetOrderBySellerId(sellerId, condition, branchId)
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public resetWarehouseBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const sellerId = req.seller_id as any;
        const condition = req.query.condition as any;
        const createId = req.id as any;
        const branchId = req.query.branch_id as any;
        try {
            const result = await this.service.resetWarehouseBySellerId(sellerId,createId, condition, branchId)
            if (result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }
}