const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const Storage=require('../services/supabaseStorage');
test('medical upload requires ownership, registers before return, and removes unregistered new files',async t=>{
 const file=path.join(os.tmpdir(),`ownership-${process.pid}.txt`);fs.writeFileSync(file,'synthetic');t.after(()=>fs.unlinkSync(file));
 const calls=[];let fail=false;
 const client={rpc:async(name,args)=>{calls.push(['owner',name,args]);return fail?{error:new Error('registry down')}:{};},storage:{from(bucket){return{
 upload:async(key,bytes,options)=>{assert.equal(options.upsert,false);calls.push(['upload',bucket,key]);return{data:{path:key}};},
 remove:async keys=>{calls.push(['remove',keys]);return{};},getPublicUrl:()=>({data:{publicUrl:'https://reference.invalid/file'}})
 };}}};
 await assert.rejects(()=>Storage.uploadFile(file,'neurosense-reports','a.txt','text/plain',client),/ownership/);assert.equal(calls.length,0);
 const result=await Storage.uploadFile(file,'neurosense-reports','a.txt','text/plain',client,'patient');assert.equal(result.path,'a.txt');assert.equal(calls[1][0],'owner');
 fail=true;await assert.rejects(()=>Storage.uploadFile(file,'neurosense-reports','b.txt','text/plain',client,'patient'),/registry down/);assert.deepEqual(calls.at(-1),['remove',['b.txt']]);
});

test('private document signing and deletion use the request-routed client', async () => {
 const calls=[];
 const client={storage:{from(bucket){return{
  createSignedUrl:async(key,expiry)=>{calls.push(['sign',bucket,key,expiry]);return{data:{signedUrl:'https://signed.invalid/file'}};},
  remove:async keys=>{calls.push(['delete',bucket,keys]);return{};}
 };}}};
 const signed=await Storage.getSignedUrl('patients_documents','patient/file.pdf',600,client);
 assert.equal(signed.signedUrl,'https://signed.invalid/file');
 await Storage.deleteFile('patient/file.pdf','patients_documents',client);
 assert.deepEqual(calls,[['sign','patients_documents','patient/file.pdf',600],['delete','patients_documents',['patient/file.pdf']]]);
});
