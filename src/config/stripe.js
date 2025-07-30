const Stripe = require('stripe');
require('dotenv').config();

export const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

