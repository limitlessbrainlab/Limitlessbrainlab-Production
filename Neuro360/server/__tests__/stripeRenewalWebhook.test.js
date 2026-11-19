const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const { recordStripeInvoice } = require('../services/stripeInvoicePayment');

test('Stripe webhook records paid invoices, labels receipts, and retries failed writes without duplicates', async () => {
  const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
  const start = source.indexOf("app.post('/api/stripe-webhook',");
  const end = source.indexOf('\n});', start);
  const payments = new Map();
  const notifications = new Set();
  const messages = [];
  let writeError = null;
  let customerLookup;
  let webhook;

  vm.runInNewContext(source.slice(start, end + '\n});'.length), {
    app: { post: (_path, _middleware, handler) => { webhook = handler; } },
    express: { raw: () => () => {} },
    recordStripeInvoice,
    stripe: {
      webhooks: { constructEvent: (body) => body },
      customers: { retrieve: (id) => customerLookup(id) },
    },
    process: { env: { STRIPE_WEBHOOK_SECRET: 'test-secret' } },
    console: { log() {}, error() {} },
    supabase: {
      from(table) {
        assert.equal(table, 'payments');
        return {
          upsert(row, options) {
            assert.equal(options.onConflict, 'stripe_invoice_id');
            assert.equal(options.ignoreDuplicates, true);
            return {
              async select() {
                if (writeError) return { error: writeError };
                if (payments.has(row.stripe_invoice_id)) return { data: [] };
                payments.set(row.stripe_invoice_id, row);
                return { data: [{ id: row.stripe_invoice_id }] };
              }
            };
          }
        };
      }
    },
    mailerConfigured: true,
    emailTransporter: { async sendMail(message) { messages.push(message); } },
    async claimNotificationOnce(key) {
      if (notifications.has(key)) return false;
      notifications.add(key);
      return true;
    },
    EMAIL_FROM: 'receipts@example.test',
    APP_URL: 'https://example.test',
    LOGO_PATH: 'logo.png',
    LOGO_CID: 'company-logo',
    CONTACT_STRIP_HTML: '',
  });

  const invoice = {
    id: 'in_renewal',
    status: 'paid',
    billing_reason: 'subscription_cycle',
    customer_email: 'Patient@Example.Test',
    amount_paid: 1299,
    currency: 'usd',
    created: 1794960000,
    payments: { data: [], has_more: false },
    status_transitions: { paid_at: 1794963600 },
    parent: { subscription_details: { metadata: { tier: 'PRO' } } },
  };
  const deliver = async (invoicePayload) => {
    const req = {
      headers: { 'stripe-signature': 'test-signature' },
      body: { type: 'invoice.payment_succeeded', data: { object: invoicePayload } },
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; },
    };
    await webhook(req, res);
    return res;
  };

  const manualInvoice = {
    ...invoice, id: 'in_manual', billing_reason: 'manual', amount_paid: 49900, parent: null,
    lines: { data: [{ description: 'DecodeMyBrain™ Student' }] },
  };
  assert.equal((await deliver({ ...manualInvoice, status: 'open' })).body.received, true);
  assert.equal(payments.size, 0);
  assert.equal(messages.length, 0);

  assert.equal((await deliver(manualInvoice)).body.received, true);
  assert.equal((await deliver(manualInvoice)).body.received, true);
  assert.equal(payments.get(manualInvoice.id).type, 'stripe_invoice');
  assert.equal(payments.get(manualInvoice.id).amount, 499);
  assert.equal(payments.get(manualInvoice.id).package_name, 'DecodeMyBrain™ Student');
  assert.match(messages[0].subject, /^Payment Receipt/);
  assert.match(messages[0].html, /We received your payment/);
  assert.doesNotMatch(messages[0].html, /renew/i);
  assert.match(messages[1].subject, /^Invoice Payment Received/);
  assert.equal((await deliver({ ...invoice, id: null })).statusCode, 500);
  assert.equal(payments.size, 1);
  assert.equal(messages.length, 2);

  writeError = new Error('database unavailable');
  assert.equal((await deliver(invoice)).statusCode, 500);
  assert.equal(payments.size, 1);
  assert.equal(messages.length, 2);

  writeError = null;
  assert.equal((await deliver(invoice)).body.received, true);
  assert.equal((await deliver(invoice)).body.received, true);
  assert.equal(payments.size, 2);
  const payment = payments.get(invoice.id);
  assert.deepEqual({ ...payment }, {
    stripe_invoice_id: invoice.id,
    payment_id: invoice.id,
    patient_email: 'patient@example.test',
    amount: 12.99,
    currency: 'USD',
    status: 'completed',
    type: 'subscription_renewal',
    package_name: 'PRO Subscription Renewal',
    payment_method: 'stripe',
    created_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
  });
  assert.equal(messages.length, 4);
  assert.match(messages[2].subject, /^Subscription Renewed/);

  const missingEmail = { ...manualInvoice, id: 'in_missing_email', customer_email: ' ', customer: 'cus_test' };
  customerLookup = async () => { throw new Error('Stripe unavailable'); };
  assert.equal((await deliver(missingEmail)).statusCode, 500);
  customerLookup = async () => ({ email: ' ' });
  assert.equal((await deliver(missingEmail)).statusCode, 500);
  assert.equal(payments.has(missingEmail.id), false);
  assert.equal(notifications.size, 2);
  assert.equal(messages.length, 4);

  customerLookup = async (id) => {
    assert.equal(id, 'cus_test');
    return { email: ' Customer@Example.Test ' };
  };
  assert.equal((await deliver(missingEmail)).body.received, true);
  assert.equal(payments.get(missingEmail.id).patient_email, 'customer@example.test');

  const metadataEmail = { ...missingEmail, id: 'in_metadata_email', metadata: { patient_email: 'Metadata@Example.Test' } };
  customerLookup = async () => { throw new Error('Unexpected customer lookup'); };
  assert.equal((await deliver(metadataEmail)).body.received, true);
  assert.equal(payments.get(metadataEmail.id).patient_email, 'metadata@example.test');
});

test('a paid invoice links to its Checkout payment without changing purchase metadata', async () => {
  const checkout = {
    id: 'checkout-row',
    package_name: 'Checkout package',
    type: 'assessment',
    amount: 499,
    clinic_id: 'clinic-id',
    stripe_session_id: 'cs_checkout',
    payment_id: 'pi_checkout',
    stripe_invoice_id: null
  };
  const rows = [checkout];
  const invoice = {
    id: 'in_checkout',
    customer_email: 'patient@example.test',
    amount_paid: 49900,
    currency: 'usd',
    created: 1794960000
  };
  let updates = 0;
  let lookupError;
  let updateError;
  const supabase = {
    from(table) {
      assert.equal(table, 'payments');
      return {
        select() {
          return {
            or(filter) {
              assert.equal(filter, 'stripe_payment_id.eq.pi_checkout,payment_id.eq.pi_checkout');
              return {
                async maybeSingle() {
                  return { data: rows.find(row => row.payment_id === 'pi_checkout'), error: lookupError };
                }
              };
            }
          };
        },
        update(fields) {
          assert.deepEqual(fields, { stripe_invoice_id: 'in_checkout' });
          updates += 1;
          return {
            eq(column, id) {
              assert.equal(column, 'id');
              assert.equal(id, checkout.id);
              return {
                or(filter) {
                  assert.equal(filter, 'stripe_invoice_id.is.null,stripe_invoice_id.eq.in_checkout');
                  return {
                    select() {
                      return {
                        async maybeSingle() {
                          if (updateError) return { error: updateError };
                          Object.assign(rows[0], fields);
                          return { data: rows[0] };
                        }
                      };
                    }
                  };
                }
              };
            }
          };
        }
      };
    }
  };
  const stripe = {
    invoicePayments: {
      async list(options) {
        assert.deepEqual(options, { invoice: invoice.id, status: 'paid', limit: 2 });
        return {
          data: [{ status: 'paid', amount_paid: 49900, payment: { payment_intent: { id: 'pi_checkout' } } }],
          has_more: false
        };
      }
    }
  };
  const expected = { ...checkout, stripe_invoice_id: invoice.id };

  lookupError = new Error('Checkout lookup failed');
  await assert.rejects(recordStripeInvoice(invoice, stripe, supabase), lookupError);
  lookupError = null;
  updateError = new Error('Invoice link failed');
  await assert.rejects(recordStripeInvoice(invoice, stripe, supabase), updateError);
  assert.equal(rows[0].stripe_invoice_id, null);
  updateError = null;

  assert.equal((await recordStripeInvoice(invoice, stripe, supabase)).inserted, false);
  assert.equal((await recordStripeInvoice({ ...invoice, payment_intent: 'pi_checkout' }, stripe, supabase)).inserted, false);
  assert.deepEqual(rows, [expected]);
  assert.equal(updates, 2);
});
