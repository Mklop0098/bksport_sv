import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ModuleDetailController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class ModuleDetailRoute implements IRoute {
    public path = '/module-detail';
    public router = Router();

    public controller = new ModuleDetailController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListstatus);
        this.router.patch(this.path + '/:id', errorMiddleware(CreateDto, 'body', true), AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-status/:id', AuthMiddleware.authorization(true), this.controller.updatestatus);
    }
}

export default ModuleDetailRoute; 