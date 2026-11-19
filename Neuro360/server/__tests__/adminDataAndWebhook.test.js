const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const vm=require('node:vm');
const verify=require('../middleware/calendlySignature');
const {requireAdmin}=require('../utils/patientEmailAccess');
test('Calendly requires configured secret, exact body signature and fresh timestamp',()=>{
 const oldKey=process.env.CALENDLY_WEBHOOK_SIGNING_KEY,oldSecret=process.env.CALENDLY_WEBHOOK_SECRET;
 try {
  const rawBody=Buffer.from('{ "event": "invitee.created" }');
  const timestamp=String(Math.floor(Date.now()/1000));
  const signature=crypto.createHmac('sha256','fixture-key').update(`${timestamp}.`).update(rawBody).digest('hex');
  const req={rawBody,headers:{'calendly-webhook-signature':`t=${timestamp},v1=${signature}`}};
  function run(request){let status=200,allowed=false;verify(request,{status(n){status=n;return this;},json(){}},()=>allowed=true);return{status,allowed};}
  delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;delete process.env.CALENDLY_WEBHOOK_SECRET;
  assert.equal(run(req).status,503);
  process.env.CALENDLY_WEBHOOK_SIGNING_KEY='fixture-key';
  assert.equal(run(req).allowed,true);
  assert.equal(run({...req,rawBody:Buffer.from('{"event":"invitee.created"}')}).status,401);
  assert.equal(run({...req,rawBody:undefined}).status,401);
  assert.equal(run({...req,headers:{}}).status,401);
  assert.equal(run({...req,headers:{'calendly-webhook-signature':`t=1,v1=${signature}`}}).status,401);
 } finally {
  if(oldKey===undefined)delete process.env.CALENDLY_WEBHOOK_SIGNING_KEY;else process.env.CALENDLY_WEBHOOK_SIGNING_KEY=oldKey;
  if(oldSecret===undefined)delete process.env.CALENDLY_WEBHOOK_SECRET;else process.env.CALENDLY_WEBHOOK_SECRET=oldSecret;
 }
});
test('actual admin data routes deny patient and clinic identities before database access',async()=>{
 const source=fs.readFileSync(require.resolve('../index.js'),'utf8');const handlers={};let reads=0;
 const ctx={app:{get:(p,...h)=>handlers[p]=h,delete:(p,...h)=>handlers[p]=h},authMiddleware(){},require:()=>({requireAdmin}),supabase:{from(){reads++;throw Error('unexpected DB access');}},console:{error(){}}};
 for(const[method,path]of [['get','/api/inquiries/:type'],['delete','/api/inquiries/:type/:id'],['get','/api/website-payments']]){
  const start=source.indexOf(`app.${method}('${path}'`);vm.runInNewContext(source.slice(start,source.indexOf('\n});',start)+4),ctx);
  assert.equal(handlers[path][0],ctx.authMiddleware);
  for(const role of ['patient','clinic_admin']){
   let status=200;const res={status(n){status=n;return this;},json(){}};
   await handlers[path].at(-1)({user:{role},params:{type:'feedback',id:'fixture'}},res);assert.equal(status,403);
  }
 }
 assert.equal(reads,0);
});

test('Website Payments shows Stripe invoices, deduplicates linked sessions, and surfaces ledger errors', async () => {
  const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
  const start = source.indexOf("app.get('/api/website-payments'");
  let handler;
  let ledgerError;
  const ranges = [];
  const checkout = { id: 'checkout', type: 'coaching', stripe_session_id: 'cs_checkout', amount: 25 };
  const firstPage = [
    { id: 'linked', type: 'assessment', stripe_session_id: 'cs_linked', stripe_invoice_id: 'in_linked', package_name: 'Ledger assessment', amount: 499, patient_email: 'ledger@example.test', status: 'completed' },
    ...Array.from({ length: 999 }, (_, index) => ({
      ...checkout, id: `checkout-${index}`, stripe_session_id: `cs_checkout_${index}`
    })),
  ];
  const secondPage = [
    { id: 'manual', type: 'stripe_invoice', stripe_invoice_id: 'in_manual', package_name: 'Manual invoice', amount: 32 },
    { id: 'renewal', type: 'subscription_renewal', stripe_invoice_id: 'in_renewal', amount: 99 },
    { ...checkout, stripe_invoice_id: 'in_checkout' },
  ];
  vm.runInNewContext(source.slice(start, source.indexOf('\n});', start) + 4), {
    app: { get: (_path, _auth, listener) => { handler = listener; } },
    authMiddleware() {},
    console: { error() {} },
    supabase: {
      from(table) {
        if (table === 'payments') {
          const query = {
            select() { return query; },
            or(filter) {
              assert.match(filter, /stripe_invoice_id\.not\.is\.null/);
              assert.match(filter, /stripe_session_id\.like\.cs_\*/);
              return query;
            },
            order() { return query; },
            async range(first, last) {
              ranges.push([first, last]);
              if (first === 0) return { data: firstPage };
              assert.equal(first, 1000);
              return { data: secondPage, error: ledgerError };
            }
          };
          return query;
        }
        return {
          select: () => ({
            async order() {
              const data = table === 'assessment_purchases'
                ? [{
                    id: 'assessment', stripe_session_id: 'cs_linked', assessment_name: 'Student assessment',
                    patient_email: 'patient@example.test', amount_paid: 450, status: 'paid',
                    assessment_link: 'https://example.test/assessment'
                  }]
                : [];
              return { data };
            }
          })
        };
      }
    }
  });

  const req = { user: { role: 'super_admin' } };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; }
  };
  await handler(req, res);
  assert.equal(res.body.success, true);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999]]);
  assert.equal(res.body.data.length, 1003);
  const linked = res.body.data.find(row => row.stripe_session_id === 'cs_linked');
  assert.equal(linked.id, 'assessment');
  assert.equal(linked.type, 'Assessment');
  assert.equal(linked.product, 'Student assessment');
  assert.equal(linked.email, 'patient@example.test');
  assert.equal(linked.amount, 450);
  assert.equal(linked.status, 'paid');
  assert.equal(linked.stripe_invoice_id, 'in_linked');
  assert.equal(linked.link, 'https://example.test/assessment');
  assert.equal(res.body.data.find(row => row.id === 'manual').type, 'Stripe Invoice');
  assert.equal(res.body.data.find(row => row.id === 'renewal').type, 'Subscription');
  assert.equal(res.body.data.find(row => row.id === 'checkout').type, 'Coaching');
  assert.equal(res.body.data.find(row => row.id === 'checkout').stripe_invoice_id, 'in_checkout');

  ledgerError = new Error('Payments ledger unavailable');
  await handler(req, res);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
});
