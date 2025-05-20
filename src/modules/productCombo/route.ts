import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { ProductComboController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import multer from "multer";    
class ProductComboRoute implements IRoute {
    public path = '/product-combo';
    public router = Router();

    public controller = new ProductComboController();
    public upload = multer({ storage: multer.memoryStorage() });
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(this.path + '/', 
            AuthMiddleware.authorization(),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]),
            errorMiddleware(CreateDto, 'body', false), this.controller.createProduct);
        this.router.get(this.path + '/findById/:id', this.controller.findByIdUpdate);
        this.router.get(this.path + '/', AuthMiddleware.authorization(), this.controller.searchs);
        this.router.put(this.path + '/:id',  AuthMiddleware.authorization(),
        this.upload.fields([
            { name: 'files', maxCount: 10 },
        ]),
        errorMiddleware(CreateDto, 'body', false), this.controller.updateProduct);
        this.router.get(this.path + '/get-combo-product', AuthMiddleware.authorization(), this.controller.getComboProduct);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(), this.controller.updatePublish);
    }
}


export default ProductComboRoute;