import { sendResponse } from "@core/utils";
import ProductComboService from "./service";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";

export class ProductComboController {
    public service = new ProductComboService();
    public createProduct = async (req: Request, res: Response, next: NextFunction) => {
        const listImage = req.files;
        const model: CreateDto = req.body;
        model.combo_details = JSON.parse(req.body.combo_details)
        model.created_id = req.id;
        model.seller_id = req.seller_id;
        try {
            const result = await this.service.createComboProduct(model, listImage);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result as any);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error)
        }
    }
    
    public findByIdUpdate = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.findComboById(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const name: string = req.query.name as any;
        const key: string = req.query.key as any;
        const publish = req.query.publish as any;
        const code: string = req.query.code as any;
        const is_sell: number = req.query.is_sell as any;
        const product_type_name: string = req.query.product_type_name as any;
        const product_type_id: number = req.query.product_type as any;
        const page = req.query.page as any
        const limit = req.query.limit as any
        const brand_id = req.query.brand_id as any
        const created_id = req.query.created_id as any
        const category_id = req.query.category_id as any
        const { notify, is_authentic, is_freeship, can_return, brand_origin, made_in, publish_yomart } = req.query as any
        const seller_id = req.seller_id as any
        let pageInt = parseInt(page as any)
        let limitInt = parseInt(limit as any)

        //console.log(seller_id, req)
        console.log(key, name, publish, code, pageInt, limitInt, is_sell, product_type_name, product_type_id, brand_id, created_id, category_id, notify, is_authentic, is_freeship, can_return, seller_id, brand_origin, made_in, publish_yomart)
        try {
            const result = await this.service.searchs(key, name, publish, code, pageInt, limitInt, is_sell, product_type_name, product_type_id, brand_id, created_id, category_id, notify, is_authentic, is_freeship, can_return, seller_id, brand_origin, made_in, publish_yomart);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateProduct = async (req: Request, res: Response, next: NextFunction) => {
        const listImage = req.files;
        const model: CreateDto = req.body;
        model.created_id = req.id;
        model.combo_details = JSON.parse(req.body.combo_details)
        const id: number = req.params.id as any;
        model.seller_id = req.seller_id as any;
        console.log("modeewewewel", model);

        try {
            const result = await this.service.updateCombo(model, id, listImage);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    
    public getComboProduct = async (req: Request, res: Response, next: NextFunction) => {
        const { page, limit } = req.query as any
        const { key } = req.query as any
        const seller_id = req.seller_id as any
        try {
            const result = await this.service.getComboProduct(key, seller_id, page, limit);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.service.updatePublish(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message)
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

}