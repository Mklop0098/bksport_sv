import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { FollowerController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class FollowerRoute implements IRoute {
    public path = '/follow';
    public router = Router();

    public FollowerController = new FollowerController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllFollower/:id', AuthMiddleware.authorization(true), this.FollowerController.getAllFollower);
    }
}

export default FollowerRoute   