import { sendResponse } from "@core/utils";
import ProductAttributesService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class ProductAttributesController {
    public service = new ProductAttributesService();

    public getAllProductAttributes = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllProductAttributes(id);
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

    public createNewAttributes = async (req: Request, res: Response, next: NextFunction) => {
        const {attributes} = req.body 
        const id = req.params.id as any 
        try {
            const result = await this.service.createNewAttributes(id, attributes);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }

    public updateAttribute = async (req: Request, res: Response, next: NextFunction) => {
        const {name} = req.body 
        const id = req.params.id as any 
        try {
            const result = await this.service.updateAttribute(id, name);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }

    public deleteAttribute = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any 
        try {
            const result = await this.service.deleteAttribute(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.DELETE_SUCCESS);
        } catch (error) {
            next(error)
        }
    }
}