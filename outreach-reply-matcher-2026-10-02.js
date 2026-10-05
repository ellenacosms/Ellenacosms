const inbound = $('Receive inbound WhatsApp message').first().json;
const normalize = value => { let n=String(value||'').replace(/\D/g,''); if(n.startsWith('00'))n=n.slice(2); if(/^0[37]\d{8}$/.test(n))n='256'+n.slice(1); if(/^[37]\d{8}$/.test(n))n='256'+n; return /^\d{10,15}$/.test(n)?n:''; };
const phone=normalize(inbound.sender_number||inbound.phone_number);
if(!phone) return [];
const text=String(inbound.message_text||'').trim();
const messageId=String(inbound.message_id||'');
const marker=messageId?'[message:'+messageId+']':'';
const now=new Date().toISOString();
return $input.all().flatMap((item,index)=>{
 const row=item.json;
 if(normalize(row.phone_number)!==phone || !['sent','followed_up','replied','sending'].includes(row.queue_status))return [];
 if(marker && String(row.review_note||'').includes(marker))return [];
 return [{json:{...inbound, campaign_id:row.id,prospect_id:row.prospect_id,business_name:row.business_name,campaign_note:row.review_note||'',reply_text:text,reply_received_at:now,reply_marker:marker},pairedItem:{item:index}}];
});
