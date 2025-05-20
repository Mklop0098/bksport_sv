import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { AdminResetController } from "./controller";
import { AuthMiddleware} from "@core/middleware";

class AdminResetRoute implements IRoute {
    public path = '/admin-reset';
    public router = Router();

    public AdminResetController = new AdminResetController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.delete(this.path + '/products', AuthMiddleware.authorization(), this.AdminResetController.resetProductBySellerId);
        this.router.delete(this. path + '/orders', AuthMiddleware.authorization(), this.AdminResetController.resetOrderBySellerId);
        this.router. delete(this. path + '/warehouse', AuthMiddleware.authorization(), this.AdminResetController.resetWarehouseBySellerId);
    }
}

export default AdminResetRoute   