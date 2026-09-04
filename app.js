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
      properties:{distinct_id:edgeReleaseDistinctId(),$process_person_profile:false,$current_url:location.href,page:'prototype',...properties}
    }),
    keepalive:true
  }).catch(()=>{});
}

capture('edge_release_prototype_viewed');

const navButtons=[...document.querySelectorAll('.side-nav button')];
const views=[...document.querySelectorAll('.view')];
const toast=document.getElementById('toast');
const modal=document.getElementById('prototypeModal');
const modalEyebrow=document.getElementById('prototypeModalEyebrow');
const modalTitle=document.getElementById('prototypeModalTitle');
const modalBody=document.getElementById('prototypeModalBody');
const modalActions=document.getElementById('prototypeModalActions');
let fixed=false;

function showToast(msg){
  toast.textContent=msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),2200);
}

function escapeHtml(value=''){
  return String(value).replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);
}

function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
  modalBody.innerHTML='';
  modalActions.innerHTML='';
}

function openModal({eyebrow='PROTOTYPE ACTION',title,body,primaryLabel='Done',secondaryLabel='Close',onPrimary}){
  modalEyebrow.textContent=eyebrow;
  modalTitle.textContent=title;
  modalBody.innerHTML=body;
  modalActions.innerHTML=`<button class="modal-secondary" data-modal-close>${escapeHtml(secondaryLabel)}</button><button class="modal-primary" data-modal-primary>${escapeHtml(primaryLabel)}</button>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
  modalActions.querySelector('[data-modal-close]').addEventListener('click',closeModal);
  modalActions.querySelector('[data-modal-primary]').addEventListener('click',()=>{
    if(onPrimary) onPrimary();
    else closeModal();
  });
}

document.getElementById('prototypeModalClose').addEventListener('click',closeModal);
modal.addEventListener('click',event=>{if(event.target===modal)closeModal()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&modal.classList.contains('open'))closeModal()});

navButtons.forEach(btn=>btn.addEventListener('click',()=>{
  navButtons.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  views.forEach(v=>v.classList.remove('active'));
  document.getElementById('view-'+btn.dataset.view).classList.add('active');
  capture('edge_release_prototype_section_viewed',{section:btn.dataset.view});
}));

document.querySelectorAll('[data-action="inspect"]').forEach(button=>button.addEventListener('click',()=>{
  const check=button.dataset.check||'Release check';
  openModal({
    eyebrow:'PREFLIGHT DETAIL',
    title:check,
    body:`<div class="sim-chip">Local Solid Edge scan</div><div class="prototype-kv"><span>Scope</span><strong>MACHINE_2547.asm · 186 referenced items</strong></div><div class="prototype-kv"><span>Check</span><strong>${escapeHtml(check)}</strong></div><div class="prototype-note">In the production add-in, this view would list every affected Solid Edge document and jump directly to the source file.</div>`,
    primaryLabel:'View affected files',
    onPrimary:()=>{closeModal();showToast('Affected-file drilldown simulated');capture('edge_release_check_detail_opened',{check})}
  });
  capture('edge_release_issue_inspected',{check});
}));

document.getElementById('rescanBtn').addEventListener('click',()=>{
  showToast('Preflight completed · 398 rules evaluated');
  document.getElementById('lastRun').textContent='Last scan · just now';
  capture('edge_release_preflight_run',{rules_evaluated:398});
});

function issueModal(article,action){
  const file=article.dataset.file;
  const issue=article.dataset.issue;
  capture('edge_release_issue_action_clicked',{action,file,issue});

  if(action==='open-file'){
    openModal({
      eyebrow:'SOLID EDGE HANDOFF',
      title:`Open ${file}`,
      body:`<div class="sim-chip">Desktop add-in simulation</div><div class="prototype-kv"><span>Document</span><strong>${escapeHtml(file)}</strong></div><div class="prototype-kv"><span>Detected issue</span><strong>${escapeHtml(issue)}</strong></div><div class="prototype-kv"><span>Expected location</span><strong>…\\MACHINE_2547\\Manufactured\\${escapeHtml(file)}</strong></div><div class="prototype-note">The production add-in would activate Solid Edge, open this document and highlight the release check that failed.</div>`,
      primaryLabel:'Open in Solid Edge',
      onPrimary:()=>{closeModal();showToast(`${file} · Solid Edge handoff simulated`);capture('edge_release_file_open_simulated',{file})}
    });
    return;
  }

  if(action==='compare'){
    openModal({
      eyebrow:'REVISION COMPARISON',
      title:`${file} · model vs drawing`,
      body:`<div class="sim-chip">Mismatch isolated</div><table class="prototype-compare"><thead><tr><th>Document</th><th>Current revision</th><th>Status</th></tr></thead><tbody><tr><td>${escapeHtml(file)}</td><td class="prototype-diff-new">C</td><td>Latest model</td></tr><tr><td>BASEFRAME_001.dft</td><td class="prototype-diff-old">B</td><td>Drawing behind model</td></tr></tbody></table><div class="prototype-note prototype-warning">Recommended action: update the drawing from the current model and set the Draft revision to C before release.</div>`,
      primaryLabel:'Open drawing Rev B',
      onPrimary:()=>{closeModal();showToast('BASEFRAME_001.dft · comparison handoff simulated');capture('edge_release_revision_compare_simulated',{file,model_revision:'C',drawing_revision:'B'})}
    });
    return;
  }

  if(action==='open-flat'){
    openModal({
      eyebrow:'SHEET-METAL PREFLIGHT',
      title:`${file} · flat pattern`,
      body:`<div class="sim-chip">Flat pattern found</div><div class="prototype-kv"><span>Model modified</span><strong>Today · 09:31</strong></div><div class="prototype-kv"><span>Flat pattern saved</span><strong class="prototype-diff-old">Yesterday · 16:48</strong></div><div class="prototype-kv"><span>DXF eligibility</span><strong>Blocked until flat pattern is updated</strong></div><div class="prototype-note prototype-warning">Geometry changed after the saved flat pattern. EdgeRelease would open the flat-pattern environment before publishing the DXF.</div>`,
      primaryLabel:'Open flat pattern',
      onPrimary:()=>{closeModal();showToast(`${file} · flat-pattern handoff simulated`);capture('edge_release_flat_open_simulated',{file})}
    });
    return;
  }

  const isLayer=file==='PLATE_122.psm';
  openModal({
    eyebrow:'RELEASE RULE REVIEW',
    title:`${file} · ${issue}`,
    body:isLayer
      ? `<div class="sim-chip">DXF rule conflict</div><div class="prototype-kv"><span>Detected layer</span><strong>BEND_CENTERLINES</strong></div><div class="prototype-kv"><span>Company rule</span><strong>Exclude bend-line layer from manufacturing DXF</strong></div><div class="prototype-note">Recommended action: publish the DXF with the bend-centerline layer suppressed.</div>`
      : `<div class="sim-chip">Orientation warning</div><div class="prototype-kv"><span>Detected orientation</span><strong>270° from preferred datum</strong></div><div class="prototype-kv"><span>Company rule</span><strong>Longest edge aligned to X+</strong></div><div class="prototype-note">Recommended action: rotate the flat-pattern output to the preferred manufacturing orientation.</div>`,
    primaryLabel:'Apply recommended rule',
    onPrimary:()=>{closeModal();showToast(`${file} · recommended release rule simulated`);capture('edge_release_issue_rule_applied_simulated',{file,issue})}
  });
}

document.querySelectorAll('[data-issue-action]').forEach(button=>button.addEventListener('click',()=>{
  issueModal(button.closest('.issue'),button.dataset.issueAction);
}));

function editRule(article){
  const rule=article.dataset.rule;
  const valueNode=article.querySelector('[data-rule-value]');
  const currentValue=valueNode.textContent.trim();
  const fieldId='ruleEditorField';
  openModal({
    eyebrow:'COMPANY RULE',
    title:`Edit ${rule}`,
    body:`<div class="sim-chip">Prototype configuration</div><div class="prototype-note">Company-specific rules are planned as local configuration, so release behavior can match each technical office without uploading CAD data.</div><label class="prototype-field"><span>Rule value</span><textarea id="${fieldId}">${escapeHtml(currentValue)}</textarea></label>`,
    primaryLabel:'Save rule',
    secondaryLabel:'Cancel',
    onPrimary:()=>{
      const nextValue=document.getElementById(fieldId).value.trim();
      if(!nextValue){showToast('Rule value cannot be empty');return}
      valueNode.textContent=nextValue;
      article.classList.remove('rule-updated');
      requestAnimationFrame(()=>article.classList.add('rule-updated'));
      closeModal();
      showToast(`${rule} · prototype rule updated`);
      capture('edge_release_rule_updated_simulated',{rule});
    }
  });
  capture('edge_release_rule_editor_opened',{rule});
}

document.querySelectorAll('[data-rule-edit]').forEach(button=>button.addEventListener('click',()=>editRule(button.closest('[data-rule]'))));

function applyFixedState(){
  fixed=true;
  document.getElementById('bigScore').innerHTML='100<span>%</span>';
  document.getElementById('meterFill').style.width='100%';
  document.getElementById('readinessText').textContent='All blocking release checks passed.';
  document.getElementById('blockingCount').textContent='0';
  document.getElementById('warningCount').textContent='0';
  document.querySelectorAll('.qa-row').forEach(row=>{
    row.dataset.state='ok';
    const icon=row.querySelector('.status-icon');
    icon.className='status-icon ok';
    icon.textContent='✓';
    if(row.dataset.type==='drawing')row.querySelector('strong').textContent='73 / 73';
    if(row.dataset.type==='flat')row.querySelector('strong').textContent='42 / 42';
    if(row.dataset.type==='revision')row.querySelector('strong').textContent='186 / 186';
  });
  document.getElementById('issuesList').innerHTML='<div style="padding:38px;text-align:center;color:#718096"><b style="display:block;color:#1f9d68;margin-bottom:6px">✓ No open release issues</b>All blocking checks and warnings have been resolved in this simulated project.</div>';
  const issueBadge=document.querySelector('[data-view="issues"] i');
  if(issueBadge) issueBadge.textContent='0';
  document.getElementById('releaseBtn').disabled=false;
  const big=document.getElementById('releaseBigBtn');
  big.disabled=false;
  big.textContent='Generate manufacturing release';
  showToast('Simulation complete · project is release-ready');
  capture('edge_release_fix_all_simulated',{readiness_after:100});
}

document.getElementById('fixAllBtn').addEventListener('click',applyFixedState);

function generateRelease(){
  if(!fixed)return;
  capture('edge_release_release_generated',{project:'MACHINE_2547_REV_C'});
  openModal({
    eyebrow:'RELEASE COMPLETE',
    title:'MACHINE_2547_REV_C generated',
    body:`<div class="sim-chip">Release readiness · 100%</div><div class="prototype-kv"><span>Components checked</span><strong>186</strong></div><div class="prototype-kv"><span>PDF drawings</span><strong>73 generated</strong></div><div class="prototype-kv"><span>Sheet-metal DXFs</span><strong>42 generated</strong></div><div class="prototype-kv"><span>STEP files</span><strong>31 generated</strong></div><div class="prototype-kv"><span>Release blockers</span><strong class="prototype-diff-new">0</strong></div><div class="prototype-note">A production build would now write the manufacturing package and a release manifest to the configured local project folder.</div>`,
    primaryLabel:'Open release folder',
    onPrimary:()=>{closeModal();showToast('MACHINE_2547_REV_C · release folder simulated');capture('edge_release_release_folder_opened_simulated')}
  });
}

document.getElementById('releaseBtn').addEventListener('click',generateRelease);
document.getElementById('releaseBigBtn').addEventListener('click',generateRelease);
