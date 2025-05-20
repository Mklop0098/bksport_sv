import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { SellerCategoryController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
class SellerCategoryRoute implements IRoute {
    public path = '/seller_category';
    public router = Router();

    public controller = new SellerCategoryController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.deleteOne);
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.getSellerCategoryBySellerId);
    }
}


export default SellerCategoryRoute;