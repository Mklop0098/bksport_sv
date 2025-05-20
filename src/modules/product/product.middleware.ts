import errorMessages from "@core/config/constants";
import { IErrors } from "@core/interfaces";
import { sendResponse } from "@core/utils";
import { Request, Response, NextFunction } from "express";

export namespace ProductMiddleware {
    export const create = async (req: Request, res: Response, next: NextFunction) => {
        let errors: IErrors[] = []
        const { name, weight, unit, retail_price, wholesale_price, import_price, brand_id, product_type_id, description, is_sell } = req.body;
        if (!name) {
            errors.push({
                message: errorMessages.MISSING_NAME,
                field: "name"
            })
        }
        // if (!weight) {
        //     errors.push({
        //         message: errorMessages.MISSING_WEIGHT,
        //         field: "weight"
        //     })
        // }
        // if (!unit) {
        //     errors.push({
        //         message: errorMessages.MISSING_UNIT,
        //         field: "unit"
        //     })
        // }
        // if (!retail_price) {
        //     errors.push({
        //         message: errorMessages.MISSING_RETAIL_PRICE,
        //         field: "retail_price"
        //     })
        // }
        // if (!wholesale_price) {
        //     errors.push({
        //         message: errorMessages.MISSING_WHOLESALE_PRICE,
        //         field: "wholesale_price"
        //     })
        // }
        // if (!import_price) {
        //     errors.push({
        //         message: errorMessages.MISSING_IMPORT_PRICE,
        //         field: "import_price"
        //     })
        // }
        // if (!brand_id) {
        //     errors.push({
        //         message: errorMessages.MISSING_BRAND_ID,
        //         field: "brand_id"
        //     })
        // }
        // if (!product_type_id) {
        //     errors.push({
        //         message: errorMessages.MISSING_PRODUCT_TYPE_ID,
        //         field: "product_type_id"
        //     })
        // }
        // if (!description) {
        //     errors.push({
        //         message: errorMessages.MISSING_DESCRIPTION,
        //         field: "description"
        //     })
        // }
        // if (!is_sell) {
        //     errors.push({
        //         message: errorMessages.MISSING_IS_SELL,
        //         field: "is_sell"
        //     })
        // };
       //console.log(errors)
        if (errors && errors.length > 0)
            return sendResponse(res, 400, null as any, null, null, errors as any as IErrors)
        next()
    }
}