import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { CreateDto } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";

class ProductTaxTypeRoute implements IRoute {
    public path = '/product-tax-type';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.Controller.getAll)
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(true), this.Controller.getOne)
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', false), this.Controller.create)
        this.router.put(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.Controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.Controller.delete)
    }
}

export default ProductTaxTypeRoute;   