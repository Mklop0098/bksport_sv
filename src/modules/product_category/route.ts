import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductCategoryController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import multer from "multer";

class ProductCategoryRoute implements IRoute {
    public path = '/product-category';
    public router = Router();

    public ProductCategoryController = new ProductCategoryController();
    public upload = multer({ storage: multer.memoryStorage() });

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorization(),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]),
            errorMiddleware(CreateDto, 'body', false), this.ProductCategoryController.create);

        this.router.post(this.path + '/upload-image', this.upload.fields([
            { name: 'files', maxCount: 10 },
        ]), this.ProductCategoryController.uploadImage);

        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.ProductCategoryController.search);
        this.router.get(this.path + '/get-leaf-node', AuthMiddleware.authorization(), this.ProductCategoryController.getLeafNode);
        this.router.get(this.path + '/select', AuthMiddleware.authorization(), this.ProductCategoryController.getDataForSelect);
        this.router.get(this.path + '/select-except/:id', AuthMiddleware.authorization(), this.ProductCategoryController.getDataForSelectExcept);
        this.router.get(this.path + '/get-root', this.ProductCategoryController.getRootCategories);
        this.router.post(this.path + '/get-all-child', this.ProductCategoryController.getAllChildByListId);
        this.router.delete(this.path + '/', AuthMiddleware.authorization(), this.ProductCategoryController.delete);
        this.router.put(this.path + '/update', AuthMiddleware.authorization(), this.ProductCategoryController.updatePublish)
        this.router.put(this.path + '/update-single/:id', AuthMiddleware.authorization(), this.ProductCategoryController.updateSingleAtt)
        this.router.put(this.path + '/update-sort/:id', AuthMiddleware.authorization(), this.ProductCategoryController.updateSort)
        this.router.put(this.path + '/:id', AuthMiddleware.authorization(), this.upload.fields([
            { name: 'files', maxCount: 10 },
        ]), this.ProductCategoryController.update);
        this.router.get(this.path + '/:id', AuthMiddleware.authorization(), this.ProductCategoryController.getById);
        this.router.delete(this.path + '/image/:id', AuthMiddleware.authorization(), this.ProductCategoryController.deleteImage);

    }
}

export default ProductCategoryRoute   