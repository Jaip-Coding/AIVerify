const $ = s => document.querySelector(s);
const scanBtn = $('#scanBtn');
const urlInput = $('#urlInput');
const progress = $('#scanProgress');
const progressText = $('#progressText');
const scanError = $('#scanError');
const scanResults = $('#scanResults');
const questionSection = $('#questionnaire');
const questionsForm = $('#questionsForm');
const assessmentSection = $('#assessment');
const assessmentContent = $('#assessmentContent');

let currentScan = null;
let currentAssessment = null;

const questions = [
  ['customerFacingAI','Does the company use AI that interacts directly with customers or other natural persons?','Examples: an AI chatbot, AI voice agent or interactive AI assistant.'],
  ['usersInformedAI','Where direct AI interaction exists, are users informed that they are interacting with AI?','Answer for the actual interaction flow, not merely a general privacy policy.'],
  ['providerGenerativeAI','Is the company the provider of an AI system that generates synthetic audio, image, video or text?','This asks about provider status, not simply using a third-party generative AI tool.'],
  ['machineReadableMarking','If it is such a provider, are generated/manipulated outputs machine-readably marked and detectable as AI-generated?','The MVP does not independently verify the technical marking implementation.'],
  ['emotionRecognition','Does the company deploy an emotion-recognition system affecting natural persons?','Examples may include systems inferring emotions from biometric or behavioural signals.'],
  ['biometricCategorisation','Does the company deploy biometric categorisation affecting natural persons?','This is separate from ordinary account/profile categorisation.'],
  ['deepfakes','Does the company deploy AI to generate or manipulate deepfake image, audio or video content?','If yes, disclosure implementation and exceptions require closer review.'],
  ['publicInterestAIText','Does the company publish AI-generated/manipulated text to inform the public on matters of public interest?','Human review/editorial control may affect the applicable obligation.'],
  ['aiInventory','Does the company maintain an internal inventory/register of the AI systems it uses?','A governance-readiness check that improves the reliability of future assessments.']
];

function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

function renderQuestions(){
  questionsForm.innerHTML = questions.map(([key,title,desc]) => `
    <article class="question-card">
      <h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p>
      <div class="choice-row">
        ${[['yes','Yes'],['no','No'],['unknown','Not sure']].map(([v,l]) => `<label><input type="radio" name="${key}" value="${v}" ${v==='unknown'?'checked':''}><span>${l}</span></label>`).join('')}
      </div>
    </article>`).join('');
}
renderQuestions();

function signalCard(label, signal, positiveLabel){
  const found = signal.detected;
  return `<article class="evidence-card"><span class="signal-label">${escapeHtml(label)}</span><div class="signal-status ${found?'found':'unknown'}">${found?positiveLabel:'Not verified'}</div><p>${found && signal.evidence?.length ? escapeHtml(signal.evidence[0]) : 'No conclusive evidence was detected in the fetched public HTML. This is not proof that the item is absent.'}</p><span class="badge">Confidence: ${escapeHtml(signal.confidence || 'low')}</span></article>`;
}

function renderScan(scan){
  const s = scan.signals;
  scanResults.innerHTML = `
    <div class="result-header"><div><small>PUBLIC EVIDENCE SCAN</small><h3>${escapeHtml(scan.title || new URL(scan.target).hostname)}</h3></div><span>${escapeHtml(new Date(scan.fetchedAt).toLocaleString())}</span></div>
    <div class="evidence-grid">
      ${signalCard('Interactive AI / chat indicator',s.interactiveAI,'Indicator found')}
      ${signalCard('AI interaction disclosure',s.aiDisclosure,'Disclosure-like text found')}
      ${signalCard('AI-generated content label',s.aiGeneratedContentLabel,'Label-like text found')}
    </div>
    <div class="limitations"><strong>Scanner limitations:</strong> ${scan.limitations.map(escapeHtml).join(' · ')}</div>`;
  scanResults.classList.remove('hidden');
  questionSection.classList.remove('hidden');
  questionSection.scrollIntoView({behavior:'smooth',block:'start'});
}

async function scan(){
  const url = urlInput.value.trim();
  if(!url){ urlInput.focus(); return; }
  scanError.classList.add('hidden');scanResults.classList.add('hidden');questionSection.classList.add('hidden');assessmentSection.classList.add('hidden');
  progress.classList.remove('hidden');scanBtn.disabled=true;
  const phrases=['Resolving website securely','Fetching public HTML','Checking technology indicators','Looking for visible disclosure evidence'];
  let i=0;progressText.textContent=phrases[0];
  const timer=setInterval(()=>{i=Math.min(i+1,phrases.length-1);progressText.textContent=phrases[i]},700);
  try{
    const res=await fetch('/api/scan',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url})});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Scan failed.');
    currentScan=data; renderScan(data);
  }catch(err){ scanError.textContent=err.message; scanError.classList.remove('hidden'); }
  finally{clearInterval(timer);progress.classList.add('hidden');scanBtn.disabled=false;}
}
scanBtn.addEventListener('click',scan);urlInput.addEventListener('keydown',e=>{if(e.key==='Enter')scan()});

function collectAnswers(){
  const fd=new FormData(questionsForm);const out={};
  for(const [key] of questions) out[key]=fd.get(key)||'unknown';
  return out;
}

function statusLabel(status){return ({pass:'PASS',review:'POTENTIAL REVIEW',unknown:'REQUIRES CONFIRMATION',na:'NOT APPLICABLE'})[status]||status.toUpperCase()}
function findingHtml(f){
  return `<article class="finding collapsed">
    <span class="status-pill status-${f.status}">${statusLabel(f.status)}</span>
    <div><h3>${escapeHtml(f.title)}</h3><p>${escapeHtml(f.summary)}</p><div class="meta">Basis: ${escapeHtml(f.basis)} · Confidence: ${escapeHtml(f.confidence)}</div>
    <div class="evidence-detail"><strong>Evidence / basis used</strong><br>${f.evidence?.length?f.evidence.map(escapeHtml).join('<br>'):'No direct evidence attached — confirmation or expert review is required.'}</div></div>
    <button type="button" aria-label="Toggle evidence">⌄</button>
  </article>`
}

function renderAssessment(a){
  const s=a.summary; const readiness=s.assessedReadiness==null?'—':`${s.assessedReadiness}%`;
  assessmentContent.innerHTML=`
    <div class="assessment-hero">
      <div class="summary-card"><span>ASSESSMENT COVERAGE</span><div class="summary-big">${s.coverage}% <small>of applicable checks resolved</small></div><span>Among resolved checks, readiness indicator: <b>${readiness}</b>. This is not a compliance probability.</span><div class="stat-strip"><div><b>${s.pass}</b><small>Pass</small></div><div><b>${s.review}</b><small>Review</small></div><div><b>${s.unknown}</b><small>Unknown</small></div><div><b>${s.na}</b><small>N/A</small></div></div></div>
      <div class="assessment-note"><h3>No definitive legal verdict.</h3><p>This assessment reports what the current rules engine can support from public scan evidence plus company declarations. Missing evidence is never converted into a claim that an obligation is satisfied or breached.</p><div class="badge-line"><span class="badge">Ruleset ${escapeHtml(a.ruleset.version)}</span><span class="badge">Effective ${escapeHtml(a.ruleset.effectiveDate)}</span><span class="badge">EU · Article 50 focus</span></div></div>
    </div>
    <div class="findings-list">${a.findings.map(findingHtml).join('')}</div>
    <div class="report-actions"><button id="jsonBtn">Download assessment JSON</button><button id="printBtn">Print / Save as PDF</button></div>`;
  assessmentContent.querySelectorAll('.finding button').forEach(btn=>btn.addEventListener('click',()=>btn.closest('.finding').classList.toggle('collapsed')));
  $('#printBtn').addEventListener('click',()=>window.print());
  $('#jsonBtn').addEventListener('click',downloadJson);
  assessmentSection.classList.remove('hidden');assessmentSection.scrollIntoView({behavior:'smooth',block:'start'});
}

async function assess(){
  if(!currentScan) return;
  $('#assessBtn').disabled=true;
  try{
    const res=await fetch('/api/assess',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({scan:currentScan,answers:collectAnswers()})});
    const data=await res.json();if(!res.ok)throw new Error(data.error||'Assessment failed.');currentAssessment=data;renderAssessment(data);
  }catch(err){alert(err.message)}finally{$('#assessBtn').disabled=false}
}
$('#assessBtn').addEventListener('click',assess);

function downloadJson(){
  const payload={generatedAt:new Date().toISOString(),target:currentScan?.target,scan:currentScan,answers:collectAnswers(),assessment:currentAssessment,disclaimer:'Prototype readiness assessment. Not legal advice or a certification of compliance.'};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ai-act-readiness-${new URL(currentScan.target).hostname}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
