async function invoicePaymentIntent(invoice, stripe) {
  let intent = invoice.payment_intent;
  if (!intent) {
    const invoicePayments = invoice.payments && !invoice.payments.has_more
      ? invoice.payments
      : await stripe.invoicePayments.list({ invoice: invoice.id, status: 'paid', limit: 2 });
    const paid = invoicePayments.data.filter(payment => payment.status === 'paid');
    if (invoicePayments.has_more || paid.length !== 1 || paid[0].amount_paid !== invoice.amount_paid) return null;
    intent = paid[0].payment.payment_intent;
  }
  return typeof intent === 'string' ? intent : intent?.id;
}

async function recordStripeInvoice(invoice, stripe, supabase) {
  if (!/^in_[a-zA-Z0-9_]+$/.test(invoice.id)) throw new Error('Stripe invoice has no valid ID');
  const subscriptionMetadata = invoice.parent?.subscription_details?.metadata || invoice.subscription_details?.metadata;
  let customerEmail = [
    invoice.customer_email,
    invoice.metadata?.customer_email, invoice.metadata?.patient_email, invoice.metadata?.user_email,
    subscriptionMetadata?.customer_email, subscriptionMetadata?.patient_email, subscriptionMetadata?.user_email,
    invoice.customer?.email
  ].find(email => email?.trim())?.trim();
  if (!customerEmail) {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    try {
      if (customerId) customerEmail = (await stripe.customers.retrieve(customerId)).email?.trim();
    } catch {
      return { payerUnresolved: true };
    }
  }
  if (!customerEmail) return { payerUnresolved: true };

  const isRenewal = invoice.billing_reason === 'subscription_cycle';
  const tier = subscriptionMetadata?.tier;
  const description = invoice.lines?.data?.map(line => line.description?.trim()).filter(Boolean).join(', ');
  const payment = {
    stripe_invoice_id: invoice.id,
    payment_id: invoice.id,
    patient_email: customerEmail.toLowerCase(),
    amount: invoice.amount_paid / 100,
    currency: invoice.currency.toUpperCase(),
    status: 'completed',
    type: isRenewal ? 'subscription_renewal' : 'stripe_invoice',
    package_name: (isRenewal
      ? (tier ? `${tier} Subscription Renewal` : 'Subscription Renewal')
      : (description || invoice.description?.trim() || 'Stripe Invoice')).slice(0, 255),
    payment_method: 'stripe',
    created_at: new Date((invoice.status_transitions?.paid_at ?? invoice.created) * 1000).toISOString()
  };
  const paymentIntent = await invoicePaymentIntent(invoice, stripe);
  const payments = supabase.from('payments');
  if (paymentIntent) {
    if (!/^pi_[a-zA-Z0-9_]+$/.test(paymentIntent)) throw new Error('Stripe invoice has no valid PaymentIntent ID');
    const { data: existing, error: lookupError } = await payments.select('id,stripe_invoice_id')
      .or(`stripe_payment_id.eq.${paymentIntent},payment_id.eq.${paymentIntent}`).maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) {
      if (existing.stripe_invoice_id !== invoice.id) {
        const { data: linked, error: linkError } = await payments.update({ stripe_invoice_id: invoice.id })
          .eq('id', existing.id).or(`stripe_invoice_id.is.null,stripe_invoice_id.eq.${invoice.id}`)
          .select('id').maybeSingle();
        if (linkError) throw linkError;
        if (!linked) throw new Error('PaymentIntent is already linked to another Stripe invoice');
      }
      return { customerEmail, isRenewal, payment, inserted: false };
    }
    payment.stripe_payment_id = paymentIntent;
  }
  const { data, error } = await payments
    .upsert(payment, { onConflict: 'stripe_invoice_id', ignoreDuplicates: true }).select('id');
  if (error) throw error;
  return { customerEmail, isRenewal, payment, inserted: Boolean(data.length) };
}

module.exports = { recordStripeInvoice };
