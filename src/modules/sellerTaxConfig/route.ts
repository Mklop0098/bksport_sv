import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { CreateDto } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";

class SellerTaxConfigRoute implements IRoute {
    public path = '/seller-tax-config';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(this.path + '/update-by-seller-id', AuthMiddleware.authorization(true), this.Controller.updateBySellerId);
        this.router.get(this.path + '/get-row-by-seller-id', AuthMiddleware.authorization(true), this.Controller.getRowBySellerId);
    }
}

export default SellerTaxConfigRoute;   