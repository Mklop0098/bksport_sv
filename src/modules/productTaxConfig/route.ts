import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { CreateDto } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";

class ProductTaxConfigRoute implements IRoute {
    public path = '/product-tax-config';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {}
}

export default ProductTaxConfigRoute;   