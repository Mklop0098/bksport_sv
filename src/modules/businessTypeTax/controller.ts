import BusinessTypeTaxService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import message from "@core/config/constants";

class BusinessTypeTaxController {
    public businessTypeTaxService = new BusinessTypeTaxService();
    
    public getTaxVATInForSeller = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.businessTypeTaxService.getTaxVATInForSeller(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getTaxVATOutForSeller = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.businessTypeTaxService.getTaxVATOutForSeller(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getTaxTncnForSeller = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.businessTypeTaxService.getTaxTncnForSeller(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getTaxVATForAffiliate = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.businessTypeTaxService.getTaxVATForAffiliate(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getTaxTncnForAffiliate = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.businessTypeTaxService.getTaxTncnForAffiliate(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    
}
export default BusinessTypeTaxController;