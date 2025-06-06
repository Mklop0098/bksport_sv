import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ModuleController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class ModuleRoute implements IRoute {
    public path = '/module';
    public router = Router();

    public controller = new ModuleController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.patch(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish);
    }
}

export default ModuleRoute   