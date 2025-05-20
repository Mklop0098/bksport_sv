import businessTypeService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import message from "@core/config/constants";

class BusinessTypeController {
    public businessTypeService = new businessTypeService();
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;

        try {
            const result = await this.businessTypeService.getAll(key);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getOne = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.businessTypeService.getOne(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default BusinessTypeController;