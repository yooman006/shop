import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";  // ✅ Ensure ProductModel is imported
import mongoose from "mongoose";

// ✅ Cash on Delivery Order Controller
export async function CashOnDeliveryOrderController(req, res) {
    try {
        const userId = req.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = req.body;

        if (!list_items.length) {
            return res.status(400).json({ message: "No items in order", success: false });
        }

        const orderPayload = {
            userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            products: list_items.map(item => ({
                productId: item.productId._id,
                product_details: {
                    name: item.productId.name,
                    image: item.productId.image,
                    price: item.productId.price,
                    discount: item.productId.discount || 0,
                },
                quantity: item.quantity || 1,
            })),
            paymentId: "",
            payment_status: "CASH ON DELIVERY",
            delivery_address: addressId,
            subTotalAmt,
            totalAmt,
        };

        const generatedOrder = await OrderModel.create(orderPayload);

        await CartProductModel.deleteMany({ userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        return res.json({
            message: "Order placed successfully",
            success: true,
            data: generatedOrder
        });

    } catch (error) {
        console.error("CashOnDeliveryOrderController Error:", error);
        return res.status(500).json({ message: error.message || "Server Error", success: false });
    }
}

// ✅ Price Calculation Helper Function
export const priceWithDiscount = (price, discount = 0) => {
    const discountAmount = Math.ceil((Number(price) * Number(discount)) / 100);
    return Number(price) - discountAmount;
};

// ✅ Stripe Payment Controller
export async function paymentController(req, res) {
    try {
        const userId = req.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = req.body;

        if (!list_items.length) {
            return res.status(400).json({ message: "No items in order", success: false });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }

        const line_items = list_items.map(item => ({
            price_data: {
                currency: 'inr',
                product_data: {
                    name: item.productId.name,
                    images: item.productId.image,
                    metadata: { productId: item.productId._id }
                },
                unit_amount: priceWithDiscount(item.productId.price, item.productId.discount) * 100
            },
            adjustable_quantity: { enabled: true, minimum: 1 },
            quantity: item.quantity
        }));

        const session = await Stripe.checkout.sessions.create({
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: { userId, addressId },
            line_items,
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        });

        return res.status(200).json(session);

    } catch (error) {
        console.error("paymentController Error:", error);
        return res.status(500).json({ message: error.message || "Payment processing failed", success: false });
    }
}

// ✅ Stripe Webhook for order completion
export async function webhookStripe(req, res) {
    try {
        const event = req.body;
        console.log("Stripe Event:", event);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
            const userId = session.metadata.userId;

            const productList = [];
            for (const item of lineItems.data) {
                const product = await Stripe.products.retrieve(item.price.product);
                productList.push({
                    productId: product.metadata.productId,
                    product_details: { name: product.name, image: product.images },
                    quantity: item.quantity || 1
                });
            }

            const orderPayload = {
                userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                products: productList,
                paymentId: session.payment_intent,
                payment_status: session.payment_status,
                delivery_address: session.metadata.addressId,
                subTotalAmt: productList.reduce((acc, item) => acc + Number(item.price || 0), 0),
                totalAmt: productList.reduce((acc, item) => acc + Number(item.price || 0), 0),
            };

            const order = await OrderModel.create(orderPayload);

            if (order) {
                await UserModel.findByIdAndUpdate(userId, { shopping_cart: [] });
                await CartProductModel.deleteMany({ userId });
            }
        }

        return res.json({ received: true });

    } catch (error) {
        console.error("Webhook Error:", error);
        return res.status(500).json({ error: "Webhook processing failed" });
    }
}

// ✅ Get Orders for Logged-in User
export async function getOrderDetailsController(req, res) {
    try {
        const userId = req.userId;
        const orders = await OrderModel.find({ userId })
            .sort({ createdAt: -1 })
            .populate({ path: "products.productId", model: "product", select: "name price", strictPopulate: false })
            .populate({ path: "delivery_address", strictPopulate: false }) // ✅ Ensure lowercase model name matches
            .exec();
        return res.json({ message: "Order list", success: true, data: orders });

    } catch (error) {
        console.error("getOrderDetailsController Error:", error);
        return res.status(500).json({ message: error.message || "Server Error", success: false });
    }
}


// ✅ Get All Orders (Admin)
export async function getAllOrdersController(req, res) {
    try {
        const orders = await OrderModel.find()
            .populate({ path: "products.productId", model: "product", strictPopulate: false }) // 🔥 Changed "Product" to "product"
            .populate({ path: "delivery_address", strictPopulate: false }) // ✅ Ensure lowercase model name matches
            .exec();

        res.status(200).json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
}

// ✅ Update Order Received Status
export async function updateReceivedStatus(req, res) {
    try {
        const orderId = req.params.orderId;
        const { received } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        const updatedOrder = await OrderModel.findOneAndUpdate(
            { orderId: orderId },
            { $set: { received } },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.json({ message: "Order updated", data: updatedOrder });
    } catch (error) {
        console.error("updateReceivedStatus Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
