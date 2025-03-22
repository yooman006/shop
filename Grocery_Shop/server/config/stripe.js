import stripe from 'stripe'

const Stripe = stripe(process.env.STRIPE_SECRET_KEY)

export default Stripe
//stripe login
//stripe listen --forward-to localhost:8080/api/order/webhook