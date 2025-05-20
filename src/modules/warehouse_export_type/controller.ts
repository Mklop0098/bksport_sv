import { sendResponse } from "@core/utils";
import WarehouseExportTypeService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import { ISearch } from "./interface";
import errorMessages from "@core/config/constants";

export class WarehouseExportTypeController {
    public service = new WarehouseExportTypeService();    

    public getAllType = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getAllType();
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}