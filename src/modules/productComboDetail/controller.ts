import { sendResponse } from "@core/utils";
import ProductComboDetailService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class ProductComboDetailController {
    public service = new ProductComboDetailService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
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
}