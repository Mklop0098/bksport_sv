import UserController from "./user.controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { Create } from "./dtos/create.dto";
import { CreateDto } from "./dtos/update.dto";
import { AuthMiddleware } from "@core/middleware";

class UserRoute implements IRoute {
    public path = '/users';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public userController = new UserController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(this.path + '/', this.upload.single('file'), errorMiddleware(Create, 'body', false), AuthMiddleware.authorizationToCreateUser(), this.userController.create)
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.userController.searchs)
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.userController.getOne)
        this.router.put(this.path + '/update-list-active', AuthMiddleware.authorization(true), this.userController.updateListActive);
        this.router.put(this.path + '/update-active/:id', AuthMiddleware.authorization(true), this.userController.updateActive)
        this.router.patch(this.path + '/', this.upload.single('file'), errorMiddleware(CreateDto, "body", false), AuthMiddleware.authorization(), this.userController.updateProfile)
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.userController.deleteRows)
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.userController.delete)
        this.router.get(this.path + '/statistics', AuthMiddleware.authorization(true), this.userController.statistics)
        this.router.get(this.path + '/get-profile', AuthMiddleware.authorization(), this.userController.getProfileById)
        this.router.post(this.path + '/device-token', AuthMiddleware.authorization(), this.userController.saveDeviceToken)
        this.router.get(this.path + '/check-permission', AuthMiddleware.authorization(), this.userController.getUserByRoleId)
    }
}

export default UserRoute;   