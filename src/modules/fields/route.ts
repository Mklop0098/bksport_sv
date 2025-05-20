import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { FieldsController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import multer from "multer";
import uploadFileMiddleware from "@core/middleware/uploadFile.middleware";


class FieldsRoute implements IRoute {
    public path = '/fields';
    public router = Router();

    public FieldsController = new FieldsController();
    public upload = multer({ storage: multer.memoryStorage() });

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/getAllFields/:id', AuthMiddleware.authorization(true), this.FieldsController.getAllFields);
        this.router.post(this.path + '/',
            AuthMiddleware.authorization(),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]), this.FieldsController.createFields);
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.FieldsController.search);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.FieldsController.updatePublish);
        this.router.put(this.path + '/update-publish-yomart', AuthMiddleware.authorization(true), this.FieldsController.updatePublishYomart);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.FieldsController.findById);
        this.router.get(this.path + '/findBookingDetail/:id', AuthMiddleware.authorization(), this.FieldsController.findBookingDetail);
        this.router.patch(this.path + '/:id', uploadFileMiddleware.array, AuthMiddleware.authorization(true), this.FieldsController.updateFields);

    }
}

export default FieldsRoute   