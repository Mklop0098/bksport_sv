import Controller from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import { Create } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";

class BusinessTypeRoute implements IRoute {
    public path = '/business-type';
    public router = Router();

    public Controller = new Controller();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(this.path + '/', this.Controller.searchs)
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(), this.Controller.getOne)
    }
}

export default BusinessTypeRoute;   