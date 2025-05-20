import SellerTaxConfigService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import message from "@core/config/constants";
import { CreateDto } from "@modules/sellerTaxConfig/dtos/create.dto";

class SellerTaxConfigController {
    public sellerTaxConfigService = new SellerTaxConfigService();
    
    public updateBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const model: CreateDto = req.body;
        const seller_id = req.seller_id as any;
        
        try {
            const result = await this.sellerTaxConfigService.updateBySellerId(model, seller_id);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message as string);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    public getRowBySellerId = async (req: Request, res: Response, next: NextFunction) => {
        const seller_id = req.seller_id as any;

        try {
            const result = await this.sellerTaxConfigService.getRowBySellerId(seller_id);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.FIND_BY_ID_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
    
}
export default SellerTaxConfigController;