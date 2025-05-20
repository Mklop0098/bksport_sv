import { sendResponse } from "@core/utils";
import CategoryService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class CategoryController {
    public service = new CategoryService();

    public getDataForSelect = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getDataForSelect();
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getRootCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getRootCategories();
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}