import { Router } from 'express';
import auth from '../middleware/auth.js';
import { 
    CashOnDeliveryOrderController, 
    getAllOrdersController, 
    getOrderDetailsController, 
    paymentController, 
    updateReceivedStatus, 
    webhookStripe 
} from '../controllers/order.controller.js';

const orderRouter = Router();

orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController);
orderRouter.post('/checkout', auth, paymentController);
orderRouter.post('/webhook', webhookStripe);
orderRouter.get("/order-list", auth, getOrderDetailsController);
orderRouter.get("/allorders", getAllOrdersController);
orderRouter.put("/status/:orderId", updateReceivedStatus);  // ✅ Correct route

export default orderRouter;
