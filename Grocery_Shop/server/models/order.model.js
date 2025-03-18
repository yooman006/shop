import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: true,
        },
        orderId: {
            type: String,
            required: [true, "Provide orderId"],
            unique: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.ObjectId,
                    ref: "product",  // ✅ Fixed reference to "Product"
                    required: true,
                },
                product_details: {
                    name: { type: String, required: true },
                    image: { type: Array, default: [] },
                    price: { type: Number, required: true },
                    discount: { type: Number, default: 0 },
                },
                quantity: {
                    type: Number,
                    required: true,
                    default: 1,
                },
            },
        ],
        paymentId: {
            type: String,
            default: "",
        },
        payment_status: {
            type: String,
            enum: ["PENDING", "PAID", "CASH ON DELIVERY", "FAILED"],
            default: "PENDING",
        },
        delivery_address: {
            type: mongoose.Schema.ObjectId,
            ref: "address",  // ✅ Correct (matches lowercase model name)
            required: true,
        },
        
        subTotalAmt: {
            type: Number,
            required: true,
            default: 0,
        },
        totalAmt: {
            type: Number,
            required: true,
            default: 0,
        },
        invoice_receipt: {
            type: String,
            default: "",
        },
        received: {  // ✅ New field to track order received status
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true } // ✅ Enables createdAt & updatedAt fields automatically
);

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
