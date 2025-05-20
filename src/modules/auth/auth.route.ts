import UserController from "./auth.controller";
import { IRoute } from "@core/interfaces";
import { Router } from "express";
import multer from "multer";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import LoginDto from "./dtos/login.dto";
import ChangePasswordDto from "./dtos/changePassword.dto";
import UpdateProfileDao from "./dtos/updateProfile.dto";
import UserMiddleware from "./auth.middleware";

class AuthRoute implements IRoute {
    public path = '/auth';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public userController = new UserController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/login', errorMiddleware(LoginDto, 'body', false), this.userController.login)
        this.router.put(this.path + '/change-password', AuthMiddleware.authorization(true), errorMiddleware(ChangePasswordDto, 'body', false), this.userController.changePassword)
        this.router.post(this.path + '/logout', this.userController.logout)
        this.router.post(this.path + '/refresh-token', this.userController.refreshToken)
        // this.router.put(this.path + '/:id', this.upload.single('file'), UserMiddleware.updateProfile, errorMiddleware(UpdateProfileDao, 'body'), AuthMiddleware.authorization(true), this.userController.updateProfile)
        // this.router.get(this.path + '/getProfile', AuthMiddleware.authorization(true), this.userController.getProfileById)
        this.router.get(this.path + '/check-admin', AuthMiddleware.authorization(true), this.userController.checkAmin);
        this.router.post(this.path + '/check-token', this.userController.checkToken);
    }
}

export default AuthRoute;   