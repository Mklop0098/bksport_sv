import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductImageController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/Create.dto";
import multer from "multer";
import uploadFileMiddleware from "@core/middleware/uploadFile.middleware";

class ProductImageRoute implements IRoute {
    public path = '/product-image';
    public router = Router();

    public controller = new ProductImageController();
    public upload = multer({ storage: multer.memoryStorage() });

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/upload-one-image', uploadFileMiddleware.single, AuthMiddleware.authorization(true), this.controller.uploadOneImage);
        this.router.post(this.path + '/', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/:id', errorMiddleware(CreateDto, 'body', false), AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish)
    }
}

export default ProductImageRoute;