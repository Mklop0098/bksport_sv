import { sendResponse } from "@core/utils";
import BankService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class BankController {
    public service = new BankService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.create();
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getBankList = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getBankList();
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getBankById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getBankById(id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}