import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { Create } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";

class WarrantyRoute implements IRoute {
    public path = '/warranty';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(true), this.Controller.getOne)
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(Create, 'body', false), this.Controller.create)
        this.router.put(this.path + '/:id', errorMiddleware(Create, 'body', false), AuthMiddleware.authorization(true), this.Controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.Controller.delete)
    }
}

export default WarrantyRoute;   