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

function capture(event,properties={}){
  fetch(`${POSTHOG_HOST}/capture/`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      api_key:POSTHOG_TOKEN,
      event,
      distinct_id:edgeReleaseDistinctId(),
      properties:{$current_url:location.href,page:'prototype',...properties}
    }),
    keepalive:true
  }).catch(()=>{});
}

capture('edge_release_prototype_viewed');

const navButtons=[...document.querySelectorAll('.side-nav button')];
const views=[...document.querySelectorAll('.view')];
const toast=document.getElementById('toast');
let fixed=false;
function showToast(msg){toast.textContent=msg;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)}
navButtons.forEach(btn=>btn.addEventListener('click',()=>{navButtons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');views.forEach(v=>v.classList.remove('active'));document.getElementById('view-'+btn.dataset.view).classList.add('active');capture('edge_release_prototype_section_viewed',{section:btn.dataset.view})}));
document.querySelectorAll('[data-action="inspect"]').forEach(b=>b.addEventListener('click',()=>{showToast('Prototype: this would jump to the affected Solid Edge file.');capture('edge_release_issue_inspected')}));
document.getElementById('rescanBtn').addEventListener('click',()=>{showToast('Preflight completed · 398 rules evaluated');document.getElementById('lastRun').textContent='Last scan · just now';capture('edge_release_preflight_run',{rules_evaluated:398})});
function applyFixedState(){fixed=true;document.getElementById('bigScore').innerHTML='100<span>%</span>';document.getElementById('meterFill').style.width='100%';document.getElementById('readinessText').textContent='All blocking release checks passed.';document.getElementById('blockingCount').textContent='0';document.getElementById('warningCount').textContent='0';document.querySelectorAll('.qa-row').forEach(row=>{row.dataset.state='ok';const icon=row.querySelector('.status-icon');icon.className='status-icon ok';icon.textContent='✓';if(row.dataset.type==='drawing')row.querySelector('strong').textContent='73 / 73';if(row.dataset.type==='flat')row.querySelector('strong').textContent='42 / 42';if(row.dataset.type==='revision')row.querySelector('strong').textContent='186 / 186'});document.getElementById('issuesList').innerHTML='<div style="padding:38px;text-align:center;color:#718096"><b style="display:block;color:#1f9d68;margin-bottom:6px">✓ No open release issues</b>All blocking checks and warnings have been resolved in this simulated project.</div>';document.getElementById('releaseBtn').disabled=false;const big=document.getElementById('releaseBigBtn');big.disabled=false;big.textContent='Generate manufacturing release';showToast('Simulation complete · project is release-ready');capture('edge_release_fix_all_simulated',{readiness_after:100})}
document.getElementById('fixAllBtn').addEventListener('click',applyFixedState);
function generateRelease(){if(!fixed)return;showToast('Release pack generated · MACHINE_2547_REV_C');capture('edge_release_release_generated',{project:'MACHINE_2547_REV_C'})}
document.getElementById('releaseBtn').addEventListener('click',generateRelease);document.getElementById('releaseBigBtn').addEventListener('click',generateRelease);
