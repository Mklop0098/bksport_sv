import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { SportUnitController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class SportUnitRoute implements IRoute {
    public path = '/sport-unit';
    public router = Router();

    public controller = new SportUnitController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.put(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish);
        this.router.put(this.path + '/update-local-unit/:id', AuthMiddleware.authorization(true), this.controller.updateLocalUnit);
    }
}

export default SportUnitRoute;