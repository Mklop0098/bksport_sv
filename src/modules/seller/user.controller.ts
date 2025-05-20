import UserServices from "./user.service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";

import message from "@core/config/constants";
import { Create } from "@modules/seller/dtos/create.dto";
import { UpdateShopInfoDto } from "./dtos/updateShopInfo.dto";
interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
class SellerController {
    public userServices = new UserServices();
    public updateActive = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.updateActive(id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS);
        } catch (error) {
            next(error);
        }
    }
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as { [fieldname: string]: File[] };
        const avatarFile = files['avatar']?.[0]; 
        const backgroundFile = files['background']?.[0];
        const certificate_image = files['certificate_image']?.[0];
        const identity_front_img = files['identity_front_img']?.[0];
        const identity_back_img = files['identity_back_img']?.[0];
        const role_id: number = req.role_id as any
        const model: Create = req.body as Create;
        model.category_id = req.body.category_id.split(',').map((item: any) => Number(item))
        model.created_id = req.id
        try {
            const result = await this.userServices.create(model, role_id, avatarFile, backgroundFile, certificate_image, identity_front_img, identity_back_img);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public delete = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.delete(id);
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
    public getOne = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.getOne(id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public searchs = async (req: Request, res: Response, next: NextFunction) => {
        const key: string = req.query.key as any;
        const name: string = req.query.name as any;
        const phone: string = req.query.phone as any;
        const email: string = req.query.email as any;
        const page = req.query.page as any;
        const limit = req.query.limit as any;
        const active = req.query.active as any;
        const business_type_id = req.query.business_type_id as any;
        const seller_id = req.seller_id as any
        let pageInt = parseInt(page as any);
        let limitInt = parseInt(limit as any);

        try {
            const result = await this.userServices.searchs(key, name, phone, email, pageInt, limitInt, active, business_type_id, seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public statistics = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.userServices.statistics();
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.STATISTICS_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public deleteRows = async (req: Request, res: Response, next: NextFunction) => {
        const listId: number[] = req.body.listId;
        try {
            const result = await this.userServices.deleteRows(listId);
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
            const result = await this.userServices.updateListActive(listId, active);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        const files = req.files as { [fieldname: string]: File[] };
        const avatarFile = files['avatar']?.[0]; 
        const backgroundFile = files['background']?.[0];
        const certificate_image = files['certificate_image']?.[0];
        const identity_front_img = files['identity_front_img']?.[0];
        const identity_back_img = files['identity_back_img']?.[0];
        const model: Create = req.body as Create;
        model.category_id =  req.body.category_id ? req.body.category_id.split(',').map((item: any) => Number(item)) : []
        const id: number = req.params.id as any;
        const user_id: number = req.id as any;
        //console.log(model)
        try {
            const result = await this.userServices.updateProfile(model, id, avatarFile, backgroundFile, certificate_image, identity_front_img, identity_back_img, user_id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getProfileById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any
        try {
            const result = await this.userServices.getProfileById(id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public saveDeviceToken = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.id as any;
        const token: string = req.body.token as any;
        try {
            const result = await this.userServices.saveDeviceToken(id, token);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getSellerById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.getSellerById(id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public getSellerDetailById = async (req: Request, res: Response, next: NextFunction) => {
        const id: number = req.params.id as any;
        try {
            const result = await this.userServices.getSellerDetailById(id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.SEARCH_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public checkExistInfomation = async (req: Request, res: Response, next: NextFunction) => {
        const {field, value} = req.body as any;
        try {
            const result = await this.userServices.checkExistInfomation(field, value);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.CHECK_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }

    public updateShopInfo = async (req: Request, res: Response, next: NextFunction) => {
        const model: UpdateShopInfoDto = req.body
        const id = req.params.id as any
        try {
            const result = await this.userServices.updateShopInfo(model, id);
            if(result instanceof Error && (result as any).field)
                return sendResponse(res, (result as any).status, result.message, null, (result as any).field);
            if (result instanceof Error)
                return sendResponse(res, 400, result.message);
            return sendResponse(res, 200, message.CHECK_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default SellerController;