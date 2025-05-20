import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductController } from "./product.controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import multer from "multer";
import { ProductMiddleware } from "./product.middleware";
import uploadFileMiddleware from "@core/middleware/uploadFile.middleware";

class ProductRoute implements IRoute {
    public path = '/products';
    public router = Router();

    public productController = new ProductController();
    public upload = multer({ storage: multer.memoryStorage() });

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(this.path + '/export-excel', AuthMiddleware.authorization(true), this.productController.searchs);
        this.router.post(this.path + '/', 
            AuthMiddleware.authorization(true),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]),
            errorMiddleware(CreateDto, 'body', false), this.productController.createProduct);
        this.router.get(this.path + '/findById/:id', this.productController.findByIdUpdate);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.productController.deleteRows);
        this.router.patch(this.path + '/:id', uploadFileMiddleware.array, errorMiddleware(CreateDto, 'body', true), AuthMiddleware.authorization(true), this.productController.updateProduct);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.productController.delete);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.productController.updatePublish);
        this.router.put(this.path + '/update-publish-yomart', AuthMiddleware.authorization(true), this.productController.updatePublishYomart);
        this.router.post(this.path + '/import-excel', AuthMiddleware.authorization(true), this.upload.single('file'), this.productController.importExcelUpdate)
        this.router.delete(this.path + '/delete-one-image/:id', AuthMiddleware.authorization(true), this.productController.deleteOneImage);
        this.router.get(this.path + '/download-excel-sample', this.productController.downloadExcelSample);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.productController.searchs);
        this.router.get(this.path + '/product-warehouse/:id', AuthMiddleware.authorization(true), this.productController.getProductWarehouseInfo);
        this.router.get(this.path + '/product-warehouse-history/:id', AuthMiddleware.authorization(true), this.productController.getProductWarehouseHistory);
        this.router.get(this.path + '/get-available', AuthMiddleware.authorization(true), this.productController.getAvailableProducts);
        this.router.get(this.path + '/get-products', AuthMiddleware.authorization(true), this.productController.getProducts);
        this.router.get(this.path + '/get-no-beginning-inventory', AuthMiddleware.authorization(true), this.productController.getProductsHaveNoBeginningInventory);
        this.router.put(this.path + '/update-list-publish', AuthMiddleware.authorization(true), this.productController.updateListPublish);
        this.router.put(this.path + '/upload-image/:id', AuthMiddleware.authorization(), this.upload.fields([
            { name: 'files', maxCount: 10 },
        ]), this.productController.updateProductImage);
        this.router.post(this.path + '/product-attributes/:id', AuthMiddleware.authorization(true), this.productController.createNewAttributes);
        this.router.put(this.path + '/product-attributes/:id', AuthMiddleware.authorization(true), this.productController.updateAttribute);
        this.router.delete(this.path + '/attribute-delete/:id', AuthMiddleware.authorization(true), this.productController.deleteAttribute);
        this.router.delete(this.path + '/attribute-detail-delete/:id', AuthMiddleware.authorization(true), this.productController.deleteAttributeDetail);
        this.router.put(this.path + '/sub-product-image/:id', AuthMiddleware.authorization(true), this.productController.updateSubProductImage);
        this.router.put(this.path + '/update-sub-product/:id', AuthMiddleware.authorization(true), this.productController.updateSubProduct);
        this.router.post(this.path + '/create-sub-product', AuthMiddleware.authorization(true), this.productController.createSubProduct);
        this.router.put(this.path + '/sub-products-image', AuthMiddleware.authorization(true), this.productController.updateListSubProductImage);   
    }
}
export default ProductRoute;