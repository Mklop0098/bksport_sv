import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { AuthMiddleware } from "@core/middleware";

class BusinessTypeTaxRoute implements IRoute {
    public path = '/business-type-tax';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(this.path + '/get-tax-vat-in-for-seller', AuthMiddleware.authorization(), this.Controller.getTaxVATInForSeller)
        this.router.get(this.path + '/get-tax-vat-out-for-seller', AuthMiddleware.authorization(), this.Controller.getTaxVATOutForSeller)
        this.router.get(this.path + '/get-tax-tncn-for-seller', AuthMiddleware.authorization(), this.Controller.getTaxTncnForSeller)
        this.router.get(this.path + '/get-tax-vat-for-affiliate', AuthMiddleware.authorization(), this.Controller.getTaxVATForAffiliate)
        this.router.get(this.path + '/get-tax-tncn-for-affiliate', AuthMiddleware.authorization(), this.Controller.getTaxTncnForAffiliate)
    }
}

export default BusinessTypeTaxRoute;   