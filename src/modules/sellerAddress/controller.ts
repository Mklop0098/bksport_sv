import { sendResponse } from "@core/utils";
import SellerAddressService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class SellerAddressController {
    public service = new SellerAddressService();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        try {
            const result = await this.service.create(model);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        //console.log(model)
        const id: number = req.params.id as any
        try {
            const result = await this.service.update(model, id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_ADDRESS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    
    public getAllSellerAdressBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllSellerAdressBySellerId(id);
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