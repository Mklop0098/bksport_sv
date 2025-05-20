import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { PermissionController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";

class PermissionRoute implements IRoute {
    public path = '/permission';
    public router = Router();

    public controller = new PermissionController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // this.router.post(this.path + '/update', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.update);
        this.router.post(this.path + '/update', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.createAndUpdate);
        this.router.get(this.path + '/check-permission/',  AuthMiddleware.authorization(), this.controller.checkPermissionByUserId);
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.create);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListstatus);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-status/:id', AuthMiddleware.authorization(true), this.controller.updatestatus);
        this.router.get(this.path + '/find-all-permission-by-user-id/:id',  AuthMiddleware.authorization(true), this.controller.findPermissionOfUserId);
        this.router.get(this.path + '/find-all-permission-by-role-id/:id', AuthMiddleware.authorization(true), this.controller.findAllPermissionByRoleId);
        // this.router.get(this.path + '/find-all-permission-by-role-id/:id', AuthMiddleware.authorization(true), this.controller.findAll);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
    }
}

export default PermissionRoute; 