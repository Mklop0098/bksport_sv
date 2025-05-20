import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductComboDetailController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
class ProductComboDetailRoute implements IRoute {
    public path = '/ProductComboDetail';
    public router = Router();

    public controller = new ProductComboDetailController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/', this.controller.create);
    }
}


export default ProductComboDetailRoute;