import { sendResponse } from "@core/utils";
import { Request, Response, NextFunction } from "express";
import { CreateDto } from "./dtos/create.dto";
import message from "@core/config/constants";
import ProductCategoryService from "./service";
import { UpdateDto } from "./dtos/update.dto";
import axios from "axios";

export class ProductCategoryController {
    public service = new ProductCategoryService();

    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body
        const image = req.files as any;
        try {
            const result = await this.service.create(model, image);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, "success");
        } catch (error) {
            next(error);
        }
    }


    public uploadImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            console.log("req", req.files)
            return sendResponse(res, 200, message.CREATE_SUCCESS, "success");
        } catch (error) {
            next(error);
        }

    }


    public search = async (req: Request, res: Response, next: NextFunction) => {
        const {key, status, page, limit} = req.query as any
        let listField 
        if (status) {
            listField = JSON.parse(status)
        }
        try {
            const result = await this.service.searchs(key, listField, page, limit);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getById = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        try {
            const result = await this.service.getById(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public deleteImage = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        try {
            const result = await this.service.deleteImage(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getDataForSelect = async (req: Request, res: Response, next: NextFunction) => {
        const publish = req.query.publish as any
        try {
            const result = await this.service.getDataForSelect(publish);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getDataForSelectExcept = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any
        try {
            const result = await this.service.getDataForSelectExcept(id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getRootCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.service.getRootCategories();
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getAllChildByListId = async (req: Request, res: Response, next: NextFunction) => {
        const {listId} = req.body
        console.log(listId)
        try {
            const result = await this.service.getAllChildByListId(listId);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const {listId} = req.body
        console.log(listId)
        try {
            const result = await this.service.delete(listId);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updatePublish = async (req: Request, res: Response, next: NextFunction) => {
        const {listId, fields, publish} = req.body
        try {
            const result = await this.service.updateAttribute(listId, fields, publish);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: UpdateDto = req.body
        const id = req.params.id as any
        const image = req.files;
        console.log(id)
        try {
            const result = await this.service.update(model, id, image);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updateSort = async (req: Request, res: Response, next: NextFunction) => {
        const sort = req.body.sort as any
        const id = req.params.id as any
        try {
            const result = await this.service.updateSort(sort, id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    
    public updateSingleAtt = async (req: Request, res: Response, next: NextFunction) => {
        const {field} = req.body
        const id = req.params.id as any
        try {
            const result = await this.service.updateSingleAttribute(id, field);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getLeafNode = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any
        console.log("seller_id", seller_id)
        try {
            const result = await this.service.getLeafNode(seller_id);
            if (result instanceof Error)
                return sendResponse(res, 404, result.message);
            return sendResponse(res, 200, message.FIND_ALL_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}