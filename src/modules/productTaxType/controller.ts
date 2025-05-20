import ProductTaxTypeService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

class ShipersController {
    public productTaxTypeService = new ProductTaxTypeService();

    public getAll = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        try {
            const result = await this.productTaxTypeService.getAll(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getOne = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const seller_id = req.seller_id as any;
        try {
            const result = await this.productTaxTypeService.getOne(id, seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body as CreateDto;
        model.created_id = req.id
        model.seller_id = req.seller_id as any;
        
        try {
            const result = await this.productTaxTypeService.create(model);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        const id: number = req.params.id as any;
        const seller_id = req.seller_id as any;
        model.seller_id = seller_id;
        try {
            const result = await this.productTaxTypeService.update(model, id, seller_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message as string);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const seller_id = req.seller_id as any;
        try {
            const result = await this.productTaxTypeService.delete(id, seller_id);
            if (result instanceof Error && result.field)
                // return sendResponse(res, result.status, result.message, result.field);
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default ShipersController;