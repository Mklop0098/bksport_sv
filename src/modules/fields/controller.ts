import { sendResponse } from "@core/utils";
import FieldsService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class FieldsController {
    public service = new FieldsService();

    public getAllFields = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.getAllFields(id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public createFields = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const model: CreateDto = req.body;
            model.seller_id = req.seller_id;
            const listImageObject: any = req.files;
            model.created_id = req.id;
            const result = await this.service.createFields(model, listImageObject);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            else return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public search = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id: number = req.seller_id as any;
        try {
            const result = await this.service.search(seller_id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        try {
            const result = await this.service.updatePublish(model, id)
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }

    public updatePublishYomart = async (req: Request, res: Response, next: NextFunction) => {
        const {listId, publish} = req.body as any
        const create_id = req.id as number
        try {
            const result = await this.service.updatePublishYomart(listId, publish, create_id)
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public findById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.findById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateFields = async (req: Request, res: Response, next: NextFunction) => {
        const listImage = req.files;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        const id: number = req.params.id as any;
        model.seller_id = req.seller_id as any;
        //console.log("modeewewewel", model);

        try {
            const result = await this.service.updateFields(model, id, listImage);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public findBookingDetail = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any
        try {
            const result = await this.service.findBookingDetail(id)
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }
}