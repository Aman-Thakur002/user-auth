// const { stripe } = require("../config/stripe");
const stripe = require('../config/stripe').stripe;

export async function StripeWebhook(req, res, next) {
    let event;
    const payloadString = JSON.stringify(req.body, null, 2);
    const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: process.env.STRIPE_WEBHOOK_SECRET
    });
    try {
        event = stripe.webhooks.constructEvent(payloadString, header, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
   
    try {
        switch (event.type) {
            case 'charge.updated':
            case 'charge.failed': {
                const charge = event.data.object;
                const paymentIntentId = charge.payment_intent;
                const session = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntentId
                });
                const checkoutSession = session.data[0];
                break;
            }

            //----------<< Refund >>---------------
            case 'charge.refund.updated': {
    

                break;
            }

            default:
                break;
        }

        res.status(200).send({ received: true });
    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).send('Internal Server Error');
    }
    
}


