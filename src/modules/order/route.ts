import { IRoute } from "@core/interfaces";
import { Router } from "express";
import { OrderController } from "./controller";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { CreateDto } from "./dtos/create.dto";
import OrderMiddleware from "./middleware";
import { CommissionDto } from "./dtos/commission";

class OrderRoute implements IRoute {
    public path = '/orders';
    public router = Router();

    public controller = new OrderController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.put(this.path + '/update-list-status-payment/', AuthMiddleware.authorization(true), this.controller.updateListStatusPayment);
        this.router.put(this.path + '/update-list-status', AuthMiddleware.authorization(true), this.controller.updateListStatus);
        this.router.post(this.path + '/', AuthMiddleware.authorization(true), errorMiddleware(CreateDto, 'body', false), OrderMiddleware.orderNotification, this.controller.create);
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
        this.router.get(this.path + '/report-monthly-revenue-salary', AuthMiddleware.authorization(true), this.controller.reportRevenueAndSalaryMonthOfYear);
        this.router.get(this.path + '/export-excel', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.get(this.path + '/report-order', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.get(this.path + '/', AuthMiddleware.authorization(true), this.controller.searchs);
        this.router.patch(this.path + '/update-info/:id', errorMiddleware(CreateDto, 'body', true), AuthMiddleware.authorization(true), this.controller.updateOrder);
        this.router.patch(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.updateStatusUpdate);
        this.router.delete(this.path + '/delete-rows', AuthMiddleware.authorization(true), this.controller.deleteRows);
        this.router.delete(this.path + '/:id', AuthMiddleware.authorization(true), this.controller.delete);
        this.router.get(this.path + '/findByIdUpdate/:id', AuthMiddleware.authorization(true), this.controller.findByIdUpdate);
        this.router.get(this.path + '/findById/:id', AuthMiddleware.authorization(), this.controller.findById);
        this.router.get(this.path + '/sale-invoice/:id', AuthMiddleware.authorization(true), this.controller.reportSaleInvoice);
        this.router.put(this.path + '/update-publish/:id', AuthMiddleware.authorization(true), this.controller.updatePublish);
        this.router.post(this.path + '/export-list-invoice', AuthMiddleware.authorization(true), this.controller.exportListPDFInvoice);
        this.router.get(this.path + '/optimize', AuthMiddleware.authorization(true), this.controller.optimize);
        this.router.post(this.path + '/check-qty/:id', AuthMiddleware.authorization(true), this.controller.checkQty);
        this.router.post(this.path + '/check-can-delivery', AuthMiddleware.authorization(true), this.controller.checkCanDelivery);
        this.router.get(this.path + '/get-order-by-list-id', AuthMiddleware.authorization(true), this.controller.getOrderByListId);
        this.router.put(this.path + '/update-delivery-method-list', AuthMiddleware.authorization(true), this.controller.updateDeliveryMethodList);
    }
}

export default OrderRoute;