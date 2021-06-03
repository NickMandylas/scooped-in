import Stripe from "stripe";

export const stripe = new Stripe(
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_TEST_KEY!
    : process.env.STRIPE_LIVE_KEY!,
  { apiVersion: "2020-08-27" },
);
