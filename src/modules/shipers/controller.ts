import ShipersService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { Create as CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

class ShipersController {
    public shipersService = new ShipersService();
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const {branch_id, key, page, limit, active, type} = req.query as any;
        const seller_id = req.seller_id as any;
        let pageInt = parseInt(page as any);
        let limitInt = parseInt(limit as any);
        console.log(branch_id, key, page, limit, active, type, seller_id);
        try {
            const result = await this.shipersService.getAll(key, pageInt, limitInt, active, type, seller_id, branch_id);
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
            const result = await this.shipersService.getOne(id);
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
        // //console.log(model);
        
        
        try {
            const result = await this.shipersService.create(model);
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
            const result = await this.shipersService.update(model, id);
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
        try {
            const result = await this.shipersService.delete(id);
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
    public deleteMultiple = async (req: Request, res: Response, next: NextFunction) => {
        //console.log('okkk');
        
        const listId: number[] = req.body.listId;
        try {
            const result = await this.shipersService.deleteMultiple(listId);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateListActive = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        const active: number = req.body.active;
        try {
            const result = await this.shipersService.updateListActive(listId, active);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateActive = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.shipersService.updateActive(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
}
export default ShipersController;