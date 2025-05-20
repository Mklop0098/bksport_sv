import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductCommissionController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import multer from "multer";
import uploadFileMiddleware from "@core/middleware/uploadFile.middleware";

class ProductCommissionRoute implements IRoute {
    public path = '/product-commission';
    public router = Router();

    public controller = new ProductCommissionController();
    public upload = multer({ storage: multer.memoryStorage() });

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.controller.updateListPublish);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.update);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish);
        this.router.post(this.path + '/import-excel', this.upload.single('file'), AuthMiddleware.authorization(true), this.controller.importExcel);
    }
}

export default ProductCommissionRoute   