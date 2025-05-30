import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { UserRoleController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class UserRoleRoute implements IRoute {
    public path = '/user-role';
    public router = Router();

    public controller = new UserRoleController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.get(this.path + '/getRoleByUserId', AuthMiddleware.authorization(true), this.controller.getRoleByUserId);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
    }
}

export default UserRoleRoute   