const POSTHOG_TOKEN='phc_xtmJDHVx8KFRqxR9Z4Z5SX6M5kCePef3LQWxcpmpyva9';
const POSTHOG_HOST='https://eu.i.posthog.com';

function edgeReleaseDistinctId(){
  let id=localStorage.getItem('edgeReleaseDistinctId');
  if(!id){
    id=(globalThis.crypto?.randomUUID?.() || `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    localStorage.setItem('edgeReleaseDistinctId',id);
  }
  return id;
}

function campaignProperties(){
  const q=new URLSearchParams(location.search);
  return {
    utm_source:q.get('utm_source')||undefined,
    utm_medium:q.get('utm_medium')||undefined,
    utm_campaign:q.get('utm_campaign')||undefined,
    utm_content:q.get('utm_content')||undefined
  };
}

function capture(event,properties={}){
  const payload={
    api_key:POSTHOG_TOKEN,
    event,
    properties:{
      distinct_id:edgeReleaseDistinctId(),
      $process_person_profile:false,
      $current_url:location.href,
      $referrer:document.referrer||undefined,
      page:'landing',
      ...campaignProperties(),
      ...properties
    }
  };
  fetch(`${POSTHOG_HOST}/capture/`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload),
    keepalive:true
  }).catch(()=>{});
}

capture('edge_release_landing_viewed');

document.querySelectorAll('.prototype-link').forEach(link=>{
  link.addEventListener('click',()=>capture('edge_release_prototype_opened',{source:link.textContent.trim()}));
});

document.querySelectorAll('a[href="#pricing"]').forEach(link=>{
  link.addEventListener('click',()=>capture('edge_release_beta_interest',{source:link.textContent.trim()}));
});

const betaButton=document.getElementById('betaApplyBtn');
betaButton?.addEventListener('click',()=>capture('edge_release_beta_cta_clicked'));

const betaSection=document.getElementById('pricing');
if(betaSection && 'IntersectionObserver' in window){
  let captured=false;
  const observer=new IntersectionObserver(entries=>{
    if(!captured && entries.some(entry=>entry.isIntersecting)){
      captured=true;
      capture('edge_release_beta_section_viewed');
      observer.disconnect();
    }
  },{threshold:.35});
  observer.observe(betaSection);
}
