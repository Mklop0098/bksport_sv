import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { PurchaseOrderController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import { CreateDto as Create } from "./dtos/beginCreate.dto";
import OrderMiddleware from "./middleware";
import { CommissionDto } from "./dtos/commission";

class PurchaseOrderRoute implements IRoute {
    public path = '/purchase-order';
    public router = Router();

    public controller = new PurchaseOrderController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        // this.router.put(this.path + '/update-list-status-payment/', AuthMiddleware.authorization(true), this.controller.updateListStatusPayment);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(), this.controller.updateListStatus);
        this.router.put(this.path + '/pay-and-purchase/:id', AuthMiddleware.authorization(true), this.controller.paymentAndPurchase);
        this.router.put(this.path + '/update-status-payment/:id', AuthMiddleware.authorization(true), this.controller.updateStatusPayment);
        this.router.put(this.path + '/pay-and-purchase-list', AuthMiddleware.authorization(true), this.controller.paymentAndPurchaseList);
        
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', false), this.controller.create);
        this.router.post(this.path + '/beginning', AuthMiddleware.authorization(true), this.controller.create);
        this.router.post(this.path + '/transfer', AuthMiddleware.authorization(true), this.controller.create);
        this.router.get(this.path + '/report-order-by-status', AuthMiddleware.authorization(true), this.controller.reportOrderByFomDateToDate);
        this.router.get(this.path + '/report-status', AuthMiddleware.authorization(true), this.controller.report);
        this.router.get(this.path + '/report-delivery', AuthMiddleware.authorization(true), this.controller.reportDelivery);
        this.router.post(this.path + '/report-delivery', AuthMiddleware.authorization(true), this.controller.reportDelivery);
        this.router.get(this.path + '/report-commission-by-id/', AuthMiddleware.authorization(true), errorMiddleware(CommissionDto, 'query', false), this.controller.findAllCommissionByCreatedId);
        this.router.get(this.path + '/report-product-commission-by-id/', AuthMiddleware.authorization(true), errorMiddleware(CommissionDto, 'query', false), this.controller.findAllCommissionProductByCreatedId);
        this.router.get(this.path + '/commission', AuthMiddleware.authorization(true), this.controller.findAllCommission);
        this.router.get(this.path + '/report-revenue', AuthMiddleware.authorization(true), this.controller.reportRevenue);
        this.router.get(this.path + '/report-my-revenue', AuthMiddleware.authorization(true), this.controller.reportOrderQuantityByCreatedId);
        this.router.get(this.path + '/report-my-number-order', AuthMiddleware.authorization(true), this.controller.reportOrderQuantity);
        this.router.get(this.path + '/report-monthly-revenue-for-year', AuthMiddleware.authorization(true), this.controller.reportRevenueMonthOfYear);
        this.router.get(this.path + '/export-excel', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.get(this.path + '/report-order', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        // this.router.patch(this.path + '/update-info/:id', errorMiddleware(CreateDto, 'body', true), AuthMiddleware.authorization(true), this.controller.updateOrder);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.updateOrder);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete)
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(true), this.controller.findById);
        this.router.get(this.path + '/sale-invoice/:id', AuthMiddleware.authorization(true), this.controller.reportSaleInvoice);
        this.router.post(this.path + '/export-list-invoice', AuthMiddleware.authorization(true), this.controller.exportListPDFInvoice);
        
    }
}

export default PurchaseOrderRoute;