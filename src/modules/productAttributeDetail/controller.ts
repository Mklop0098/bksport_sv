import { sendResponse } from "@core/utils";
import ProductAttributeDetailService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class ProductAttributeDetailController {
    public service = new ProductAttributeDetailService();

    public getAllProductAttributeDetail = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllProductAttributeDetail(id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public create = async (req: Request, res: Response, next: NextFunction) => {
        
        const model: CreateDto = req.body

        try {
            const result = await this.service.create(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        
        const id: number = req.params.id as any

        try {
            const result = await this.service.delete(id);
            if (result instanceof Error)
                return sendResponse(res, 400, "Không thể xóa phiên bản sản phẩm duy nhất!");
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }
}