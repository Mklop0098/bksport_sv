import ProductTaxConfigService from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";

class ProductTaxConfigController {
    public ProductTaxConfigService = new ProductTaxConfigService();
}
export default ProductTaxConfigController;