const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const code=fs.readFileSync('outreach-reply-matcher-2026-10-02.js','utf8');
function run(rows,inbound){return vm.runInNewContext('(function(){'+code+'})()',{$:()=>({first:()=>({json:inbound})}),$input:{all:()=>rows.map(json=>({json}))},Date});}
const rows=[{id:1,phone_number:'0755091084',queue_status:'sent'},{id:2,phone_number:'256755091084',queue_status:'followed_up'},{id:3,phone_number:'254755091084',queue_status:'sent'},{id:4,phone_number:'256755091084',queue_status:'archived'},{id:5,phone_number:'256755091084',queue_status:'replied',review_note:'[message:abc]'}];
assert.equal(run(rows,{sender_number:'256755091084',message_text:'Yes',message_id:'abc'}).map(x=>x.json.campaign_id).join(','),'1,2');
assert.equal(run(rows,{sender_number:'',message_text:'Yes'}).length,0);
assert.equal(run(rows,{sender_number:'256755091084',message_text:'Prices',message_id:'def'}).length,3);
console.log('PASS: replies after follow-up; exact international phone match; repeat-message deduplication; archived rows excluded; invalid sender ignored.');
