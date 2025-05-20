require('module-alias/register');
require('dotenv').config();
import App from "./app"
import validateEnv from "@core/utils/validate_env";
import IndexRoute from "./modules/index/index.route"
import 'reflect-metadata';
import { UserRoute } from "@modules/users";
import { CustomerRoute } from "@modules/customers";
import { CustomerGroupRoute } from "@modules/customerGroup";
import { AuthRoute } from "@modules/auth";
import { ProductTypeRoute } from "@modules/productType";
import { BrandRoute } from "@modules/brand";
import { SupplierGroupRoute } from "@modules/supplierGroup";
import { SupplierRoute } from "@modules/supplier";
import { ProductRoute } from "@modules/product";
import { CityRoute } from "@modules/city";
import { DistrictRoute } from "@modules/district";
import { WardRoute } from "@modules/ward";
import { OrderRoute } from "@modules/order";
import UserAddressRoute from "@modules/userAddress/route";
import ProductImageRoute from "@modules/productImage/route";
import ProductUnitRoute from "@modules/productUnit/route";
import { OrderStatusRoute } from "@modules/orderStatusHistory";
import { RoleRoute } from "@modules/role";
import { UserRoleRoute } from "@modules/userRole";
import { DeliveryNoteRoute } from "@modules/deliveryNote";
import { DeliveryNoteDetailRoute } from "@modules/deliveryNoteDetail";
import { BranchRoute } from "@modules/branch";
import { ModuleRoute } from "@modules/module";
import { NotificationRoute } from "@modules/notification";
import { NotificationTypeRoute } from "@modules/notificationType";
import { ProductCommissionRoute } from "@modules/productCommission";
import { PermissionRoute } from "@modules/permission";
import { ModuleDetailRoute } from "@modules/moduleDetail";
import { PurchaseOrderDetailRoute } from "@modules/purchaseOrderDetail";
import { PurchaseOrderRoute } from "@modules/purchaseOrder";
import { SellerRoute } from "@modules/seller";
import { ShipersRoute } from "@modules/shipers";
import { WarehouseRoute } from "@modules/warehouse";
import { BusinessTypeRoute } from "@modules/businessType";
import { BusinessTypeTaxRoute } from "@modules/businessTypeTax";
import { WarrantyRoute } from "@modules/warranty";
import { SellerTaxConfigRoute } from "@modules/sellerTaxConfig";
import { ProductTaxTypeRoute } from "@modules/productTaxType";
// import CategoryRoute from "@modules/category/route";
import FollowerRoute from "@modules/follower/route";
import { BankRoute } from "@modules/bank";
import { SellerAddressRoute } from "@modules/sellerAddress";
import { SellerBankRoute } from "@modules/sellerBank";
import { SellerCategoryRoute } from "@modules/sellerCategory";
import ProductAttributesRoute from "@modules/productAttributes/route";
import WeightUnitRoute from "@modules/weightUnit/route";
import ProductAttributeDetailRoute from "@modules/productAttributeDetail/route";
import { AdminResetRoute } from "@modules/adminReset";
import ProductCategoryRoute from "@modules/product_category/route";
import SlugRoute from "@modules/slug/route";
import { WarehouseExportTypeRoute } from "@modules/warehouse_export_type";
import { ProductComboRoute } from "@modules/productCombo";
import { EmployeeBranchRoute } from "@modules/emplyeeBranch";
import { OrderDeliveryMethodRoute } from "@modules/orderDeliveryMethod";
import FieldsRoute from "@modules/fields/route";
import SportUnitRoute from "@modules/sportUnit/route";
import { OrdersBookingRoute } from "@modules/ordersBooking";
import { OrdersBookingDetailRoute } from "@modules/ordersBookingDetail";
import TestRoute from "@modules/testing/route";
const routes = [
    new IndexRoute(),
    new UserRoute(),
    new CustomerRoute(),
    new CustomerGroupRoute(),
    new AuthRoute(),
    new ProductTypeRoute(),
    new BrandRoute(),
    new SupplierGroupRoute(),
    new SupplierRoute(),
    new ProductRoute(),
    new CityRoute(),
    new DistrictRoute(),
    new WardRoute(),
    new OrderRoute(),
    new UserAddressRoute(),
    new ProductImageRoute(),
    new OrderStatusRoute(),
    new ProductUnitRoute(),
    new RoleRoute(),
    new UserRoleRoute(),
    new DeliveryNoteRoute(),
    new DeliveryNoteDetailRoute(),
    new BranchRoute(),
    new ModuleRoute(),
    new NotificationRoute(),
    new NotificationTypeRoute(),
    new ProductCommissionRoute(),
    new PermissionRoute(),
    new ModuleDetailRoute(),
    new PurchaseOrderDetailRoute(),
    new PurchaseOrderRoute(),
    new WarehouseRoute(),
    new SellerRoute(),
    new ShipersRoute(),
    new BusinessTypeRoute(),
    new BusinessTypeTaxRoute(),
    new WarrantyRoute(),
    new SellerTaxConfigRoute(),
    new ProductTaxTypeRoute(),
    // new CategoryRoute(),
    new FollowerRoute(),
    new BankRoute(),
    new SellerAddressRoute(),
    new SellerBankRoute(),
    new SellerCategoryRoute(),
    new ProductAttributesRoute(),
    new WeightUnitRoute(),
    new ProductAttributeDetailRoute(),
    new AdminResetRoute(),
    new ProductCategoryRoute(),
    new SlugRoute(),
    new WarehouseExportTypeRoute(),
    new ProductComboRoute(),
    new EmployeeBranchRoute(),
    new OrderDeliveryMethodRoute(),
    new FieldsRoute(),
    new SportUnitRoute(),
    new OrdersBookingRoute(),
    new OrdersBookingDetailRoute(),
    new TestRoute()
];
const app = new App(routes);

app.listen();