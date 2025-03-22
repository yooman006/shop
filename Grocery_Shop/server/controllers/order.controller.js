import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

export async function CashOnDeliveryOrderController(request, response) {
    try {
        const userId = request.userId; // Auth middleware
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        if (!list_items || list_items.length === 0) {
            return response.status(400).json({ message: "Cart is empty", error: true, success: false });
        }

        const payload = list_items.map(el => ({
            userId,
            orderId: `ORD-${new mongoose.Types.ObjectId()}`,
            productId: el.productId._id,
            product_details: {
                name: el.productId.name,
                image: el.productId.image
            },
            paymentId: "",
            payment_status: "Cash on Delivery",
            delivery_address: addressId,
            subTotalAmt,
            totalAmt,
        }));

        const generatedOrder = await OrderModel.insertMany(payload);

        // Remove from cart
        await CartProductModel.deleteMany({ userId });
        await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });

        return response.json({
            message: "Order placed successfully",
            error: false,
            success: true,
            data: generatedOrder
        });

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

export const priceWithDiscount = (price, discount = 1) => {
    const discountAmount = Math.ceil((Number(price) * Number(discount)) / 100);
    return Number(price) - discountAmount;
};

export async function paymentController(request, response) {
    try {
        const userId = request.userId;
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body;

        if (!list_items || list_items.length === 0) {
            return response.status(400).json({ message: "Cart is empty", error: true, success: false });
        }

        const user = await UserModel.findById(userId);
        if (!user) return response.status(404).json({ message: "User not found", error: true });

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
            quantity: item.quantity || 1
        }));

        const params = {
            submit_type: 'pay',
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: { userId, addressId },
            line_items,
            success_url: `${process.env.FRONTEND_URL}/success`,
            cancel_url: `${process.env.FRONTEND_URL}/cancel`
        };

        const session = await Stripe.checkout.sessions.create(params);
        return response.status(200).json(session);

    } catch (error) {
        return response.status(500).json({ message: error.message || error, error: true, success: false });
    }
}

const getOrderProductItems = async ({ lineItems, userId, addressId, paymentId, payment_status }) => {
    const productList = [];

    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            const product = await Stripe.products.retrieve(item.price.product);

            productList.push({
                userId,
                orderId: `ORD-${new mongoose.Types.ObjectId()}`,
                productId: product.metadata.productId,
                product_details: {
                    name: product.name,
                    image: product.images
                },
                paymentId,
                payment_status,
                delivery_address: addressId,
                subTotalAmt: Number(item.amount_total / 100),
                totalAmt: Number(item.amount_total / 100),
            });
        }
    }
    return productList;
};

// Webhook for Stripe payment events
export async function webhookStripe(request, response) {
    const event = request.body;
    const endPointSecret = process.env.STRIPE_ENPOINT_WEBHOOK_SECRET_KEY;

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const lineItems = await Stripe.checkout.sessions.listLineItems(session.id);
            const userId = session.metadata.userId;

            const orderProduct = await getOrderProductItems({
                lineItems,
                userId,
                addressId: session.metadata.addressId,
                paymentId: session.payment_intent,
                payment_status: session.payment_status,
            });

            const order = await OrderModel.insertMany(orderProduct);
            if (order.length > 0) {
                await UserModel.findByIdAndUpdate(userId, { shopping_cart: [] });
                await CartProductModel.deleteMany({ userId });
            }
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    response.json({ received: true });
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
