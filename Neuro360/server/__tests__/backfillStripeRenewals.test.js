const assert = require('node:assert/strict');
const test = require('node:test');
const { backfillStripeInvoices } = require('../scripts/backfill-stripe-renewals');

test('Stripe backfill classifies all paid invoices and reports duplicates and failures across pages', async () => {
  const renewal = {
    id: 'in_renewal', status: 'paid', billing_reason: 'subscription_cycle',
    customer_email: ' ', amount_paid: 1299, currency: 'usd', created: 1794960000, payments: { data: [], has_more: false },
    parent: { subscription_details: { metadata: { user_email: ' Patient@Example.Test ', tier: 'PRO' } } }
  };
  const stripe = {
    invoices: {
      async *list(options) {
        assert.deepEqual(options, { status: 'paid', limit: 100 });
        yield { ...renewal, id: 'in_manual', billing_reason: 'manual', description: 'Student purchase' };
        yield renewal;
        await Promise.resolve();
        yield { ...renewal, id: 'in_lookup', parent: null, customer: 'cus_found' };
        yield { ...renewal, id: 'in_missing', parent: null, customer: 'cus_missing' };
        yield { ...renewal, id: 'in_failed' };
      }
    },
    customers: {
      async retrieve(id) {
        if (id === 'cus_missing') throw new Error('Stripe customer unavailable');
        assert.equal(id, 'cus_found');
        return { email: 'Lookup@Example.Test' };
      }
    }
  };
  const payments = new Map();
  const supabase = {
    from(table) {
      assert.equal(table, 'payments');
      return {
        upsert(row, options) {
          assert.deepEqual(options, { onConflict: 'stripe_invoice_id', ignoreDuplicates: true });
          return {
            async select(columns) {
              assert.equal(columns, 'id');
              if (row.stripe_invoice_id === 'in_failed') return { error: new Error('write unavailable') };
              if (payments.has(row.stripe_invoice_id)) return { data: [] };
              payments.set(row.stripe_invoice_id, row);
              return { data: [{ id: row.stripe_invoice_id }] };
            }
          };
        }
      };
    }
  };

  const counts = {
    scanned: 5, inserted: 3, existing: 0,
    payerFailures: ['in_missing'], writeFailures: ['in_failed'], listError: null
  };
  assert.deepEqual(await backfillStripeInvoices(stripe, supabase), counts);
  assert.deepEqual(await backfillStripeInvoices(stripe, supabase), { ...counts, inserted: 0, existing: 3 });
  assert.deepEqual([...payments.keys()], ['in_manual', 'in_renewal', 'in_lookup']);
  assert.equal(payments.get('in_manual').type, 'stripe_invoice');
  assert.equal(payments.get('in_manual').package_name, 'Student purchase');
  assert.equal(payments.get('in_renewal').type, 'subscription_renewal');
  assert.equal(payments.get('in_renewal').patient_email, 'patient@example.test');
  assert.equal(payments.get('in_renewal').package_name, 'PRO Subscription Renewal');
  assert.equal(payments.get('in_renewal').amount, 12.99);
  assert.equal(payments.get('in_lookup').patient_email, 'lookup@example.test');

  stripe.invoices.list = async function* () {
    yield renewal;
    throw new Error('Untrusted Stripe list error');
  };
  assert.deepEqual(await backfillStripeInvoices(stripe, supabase), {
    scanned: 1, inserted: 0, existing: 1,
    payerFailures: [], writeFailures: [], listError: 'Could not list paid Stripe invoices.'
  });
});
