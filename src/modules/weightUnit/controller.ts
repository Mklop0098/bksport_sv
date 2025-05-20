import { sendResponse } from "@core/utils";
import WeightUnitService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class WeightUnitController {
    public service = new WeightUnitService();

    public getAllWeightUnit = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getAllWeightUnit();
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}