import UserController from "./user.controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { Create } from "./dtos/create.dto";
import { AuthMiddleware } from "@core/middleware";
import uploadFileMiddleware from "@core/middleware/uploadFile.middleware";

class SellerRoute implements IRoute {
    public path = '/sellers';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public userController = new UserController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {

        this.router.post(this.path + '/',
            AuthMiddleware.authorizationAdmin(),
            this.upload.fields([
                { name: 'avatar', maxCount: 1 },
                { name: 'background', maxCount: 1 },
                { name: 'certificate_image', maxCount: 1 },
                { name: 'identity_front_img', maxCount: 1 },
                { name: 'identity_back_img', maxCount: 1 },
            ]),
            errorMiddleware(Create, 'body', false), this.userController.create)

        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.userController.searchs)
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.userController.getOne)
        this.router.put(this.path + '/update-list-active', AuthMiddleware.authorization(true), this.userController.updateListActive);
        this.router.put(this.path + '/update-active/:id', AuthMiddleware.authorization(true), this.userController.updateActive)
        this.router.patch(this.path + '/:id',
            this.upload.fields([
                { name: 'avatar', maxCount: 1 },
                { name: 'background', maxCount: 1 },
                { name: 'certificate_image', maxCount: 1 },
                { name: 'identity_front_img', maxCount: 1 },
                { name: 'identity_back_img', maxCount: 1 },
            ]),
            this.userController.updateProfile)
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.userController.deleteRows)
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.userController.delete)
        this.router.get(this.path + '/statistics', AuthMiddleware.authorization(true), this.userController.statistics)
        this.router.get(this.path + '/get-profile', AuthMiddleware.authorization(true), this.userController.getProfileById)
        this.router.get(this.path + '/get-profile/:id', this.userController.getSellerById)
        this.router.get(this.path + '/get-detail/:id', this.userController.getSellerDetailById)
        this.router.post(this.path + '/check-exist-seller/', this.userController.checkExistInfomation)
        this.router.put(this.path + '/shop-info/:id', this.userController.updateShopInfo)
    }
}

export default SellerRoute;   