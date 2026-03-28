import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-04-30.basil" as any });

async function setup() {
  console.log("Setting up Stripe products and prices...\n");

  // Create the product
  const product = await stripe.products.create({
    name: "Virelle Studios Subscription",
    description: "AI-powered film production studio subscription",
  });
  console.log(`Product created: ${product.id}`);

  // Create Free price (just for tracking — $0)
  // We won't create a Stripe price for free tier, it's handled in-app

  // Create Pro price — $200/month
  const proPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 20000, // $200.00 in cents
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "pro" },
  });
  console.log(`Pro price created: ${proPrice.id} ($200/month)`);

  // Create Industry price — $1000/month
  const industryPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 100000, // $1000.00 in cents
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { tier: "industry" },
  });
  console.log(`Industry price created: ${industryPrice.id} ($1000/month)`);

  console.log("\n=== SAVE THESE VALUES ===");
  console.log(`STRIPE_PRODUCT_ID=${product.id}`);
  console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
  console.log(`STRIPE_INDUSTRY_PRICE_ID=${industryPrice.id}`);
  console.log("=========================\n");

  // Create webhook endpoint
  // We need to know the production URL for this
  // For now, output the webhook setup instructions
  console.log("=== WEBHOOK SETUP ===");
  console.log("Create a webhook in Stripe Dashboard pointing to:");
  console.log("  https://YOUR_DOMAIN/api/stripe/webhook");
  console.log("Events to listen for:");
  console.log("  - checkout.session.completed");
  console.log("  - customer.subscription.updated");
  console.log("  - customer.subscription.deleted");
  console.log("  - invoice.payment_succeeded");
  console.log("  - invoice.payment_failed");
  console.log("=====================\n");
}

setup().catch(console.error);
