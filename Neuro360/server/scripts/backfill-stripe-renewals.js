// Usage from server/: node scripts/backfill-stripe-renewals.js
// Apply the payments.stripe_invoice_id migration first. Uses the server's
// STRIPE_SECRET_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
const { recordStripeInvoice } = require('../services/stripeInvoicePayment');

async function backfillStripeInvoices(stripe, supabase) {
  const summary = { scanned: 0, inserted: 0, existing: 0, payerFailures: [], writeFailures: [], listError: null };

  try {
    for await (const invoice of stripe.invoices.list({ status: 'paid', limit: 100 })) {
      summary.scanned += 1;
      try {
        const result = await recordStripeInvoice(invoice, stripe, supabase);
        if (result.payerUnresolved) summary.payerFailures.push(invoice.id);
        else if (result.inserted) summary.inserted += 1;
        else summary.existing += 1;
      } catch {
        summary.writeFailures.push(invoice.id || null);
      }
    }
  } catch {
    summary.listError = 'Could not list paid Stripe invoices.';
  }

  return summary;
}

async function main() {
  const path = require('node:path');
  require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
  const { STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Stripe or Supabase server configuration.');
    process.exitCode = 1;
    return;
  }

  const Stripe = require('stripe');
  const { createClient } = require('@supabase/supabase-js');
  const summary = await backfillStripeInvoices(
    new Stripe(STRIPE_SECRET_KEY),
    createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  );
  console.log(JSON.stringify(summary));
  if (summary.payerFailures.length || summary.writeFailures.length || summary.listError) process.exitCode = 1;
}

if (require.main === module) {
  main().catch(() => {
    console.error('Stripe invoice backfill could not start.');
    process.exitCode = 1;
  });
}

module.exports = { backfillStripeInvoices };
