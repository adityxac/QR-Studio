(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const KEY = 'qr-studio-history-v1';
const defaults = {type:'url',size:280,fg:'#111827',bg:'#ffffff',ecc:'M',margin:2};
const state = {...defaults};
let qr = null, toastTimer = null, currentValue = '', history = readHistory();
const types = {
 url:{label:'URL',fields:[{id:'url',label:'Website URL',placeholder:'https://example.com',type:'url',value:'https://developers.google.com'}]},
 text:{label:'Plain text',fields:[{id:'text',label:'Your message',placeholder:'Write something worth sharing…',type:'textarea',value:'Hello from QR Studio!'}]},
 email:{label:'Email',fields:[{id:'email',label:'Email address',placeholder:'hello@example.com',type:'email',value:'hello@example.com'},{id:'subject',label:'Subject (optional)',placeholder:'Let’s connect',value:''},{id:'body',label:'Message (optional)',placeholder:'Hi there…',type:'textarea',value:''}]},
 phone:{label:'Phone',fields:[{id:'phone',label:'Phone number',placeholder:'+91 98765 43210',type:'tel',value:'+919876543210'}]},
 wifi:{label:'Wi-Fi',fields:[{id:'ssid',label:'Network name (SSID)',placeholder:'Your Wi-Fi name',value:'Studio WiFi'},{id:'password',label:'Password',placeholder:'Network password',type:'password',value:'scan-me-123'},{id:'encryption',label:'Security type',type:'select',options:[['WPA','WPA / WPA2 / WPA3'],['WEP','WEP'],['nopass','No password']],value:'WPA'},{id:'hidden',label:'Hidden network',type:'checkbox',value:false}]}
};
const presets = {classic:{fg:'#111827',bg:'#ffffff'},midnight:{fg:'#e7eaff',bg:'#15142b'},forest:{fg:'#174d3c',bg:'#f0f7ef'},coral:{fg:'#a12d45',bg:'#fff4ee'}};
function readHistory(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function saveHistory(){try{localStorage.setItem(KEY,JSON.stringify(history.slice(0,8)))}catch{showToast('Browser storage is unavailable; history may not persist.')}}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2300)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderFields(type,values={}) {
 const host=$('#fields');
 host.innerHTML=types[type].fields.map(f=>{
  const value=values[f.id]!==undefined?values[f.id]:f.value;
  if(f.type==='textarea')return '<div class="field"><label for="'+f.id+'">'+f.label+'</label><textarea id="'+f.id+'" placeholder="'+f.placeholder+'">'+esc(value)+'</textarea></div>';
  if(f.type==='select')return '<div class="field"><label for="'+f.id+'">'+f.label+'</label><select id="'+f.id+'">'+f.options.map(o=>'<option value="'+o[0]+'" '+(value===o[0]?'selected':'')+'>'+o[1]+'</option>').join('')+'</select></div>';
  if(f.type==='checkbox')return '<div class="field"><label><input id="'+f.id+'" type="checkbox" '+(value?'checked':'')+' style="width:auto;margin-right:8px;accent-color:var(--accent)"> '+f.label+'</label></div>';
  return '<div class="field"><label for="'+f.id+'">'+f.label+'</label><input id="'+f.id+'" type="'+(f.type||'text')+'" placeholder="'+f.placeholder+'" value="'+esc(value)+'" autocomplete="off"></div>';
 }).join('');
 host.querySelectorAll('input,textarea,select').forEach(el=>el.addEventListener('input',update));
 host.querySelectorAll('input[type=checkbox]').forEach(el=>el.addEventListener('change',update));
}
function getValues(){const vals={};types[state.type].fields.forEach(f=>{const el=$('#'+f.id);if(el)vals[f.id]=f.type==='checkbox'?el.checked:el.value});return vals}
function buildPayload(v) {
 switch(state.type){
  case 'url': {let raw=(v.url||'').trim();if(!raw)return {error:'Add a URL to generate your QR code.'};if(!/^https?:\/\//i.test(raw))raw='https://'+raw;try{const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||!u.hostname.includes('.'))throw 0;return {value:u.href,caption:u.hostname}}catch{return {error:'Enter a valid website address, like example.com.'}}}
  case 'text': return (v.text||'').trim()?{value:v.text,caption:'Plain text message'}:{error:'Add some text before generating a QR code.'};
  case 'email': {const email=(v.email||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return {error:'Enter a valid email address.'};return {value:'mailto:'+email+(v.subject?'?subject='+encodeURIComponent(v.subject)+(v.body?'&body='+encodeURIComponent(v.body):''):v.body?'?body='+encodeURIComponent(v.body):''),caption:email}}
  case 'phone': {const phone=(v.phone||'').trim();if(!/^\+?[\d\s().-]{7,20}$/.test(phone)||phone.replace(/\D/g,'').length<7)return {error:'Enter a valid phone number with at least 7 digits.'};return {value:'tel:'+phone.replace(/[\s().-]/g,''),caption:phone}}
  case 'wifi': {const ssid=(v.ssid||'').trim();if(!ssid)return {error:'Enter the Wi-Fi network name.'};if(v.encryption!=='nopass'&&!(v.password||''))return {error:'Add the Wi-Fi password, or select No password.'};const escWifi=s=>String(s).replace(/([\\;,:"])/g,'\\$1');return {value:'WIFI:T:'+v.encryption+';S:'+escWifi(ssid)+';P:'+(v.encryption==='nopass'?'':escWifi(v.password))+';H:'+(v.hidden?'true':'false')+';;',caption:'Wi-Fi · '+ssid}}
 }
 return {error:'Choose a supported QR type.'};
}
function correction(){return {L:QRCode.CorrectLevel.L,M:QRCode.CorrectLevel.M,Q:QRCode.CorrectLevel.Q,H:QRCode.CorrectLevel.H}[state.ecc]||QRCode.CorrectLevel.M}
function contrast(a,b){const lum=h=>{const c=h.replace('#','');const rgb=[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function update(){
 state.size=Number($('#size').value);state.fg=$('#fg').value;state.bg=$('#bg').value;state.ecc=$('#ecc').value;state.margin=Number($('#margin').value);
 $('#sizeValue').value=state.size+' px';$('#marginValue').value=state.margin+' units';$('#fgHex').textContent=state.fg.toUpperCase();$('#bgHex').textContent=state.bg.toUpperCase();
 $('#dimensions').textContent=state.size+' × '+state.size+' PX';
 const payload=buildPayload(getValues());const warn=[];
 if(contrast(state.fg,state.bg)<4.5)warn.push('Low foreground/background contrast may make this code difficult to scan. Aim for a contrast ratio of at least 4.5:1.');
 if(state.margin<2)warn.push('The quiet zone is small. A clear border around the code helps scanners detect its edges.');
 if(state.size<220)warn.push('Small output size can be harder to scan from a distance or when printed.');
 if((payload.value||'').length>700)warn.push('This payload is long and may create a dense QR code. Try a shorter URL or message.');
 $('#warning').classList.toggle('hidden',warn.length===0);$('#warningText').textContent=warn.join(' ');
 $('#previewCaption').textContent=payload.error?'Complete the fields to see your QR code.':payload.caption;
 $('#qrTypeLabel').textContent=types[state.type].label.toUpperCase()+' CODE';
 const box=$('#qrcode'),frame=$('.qr-frame');box.innerHTML='';frame.style.background=state.bg;frame.style.padding=(state.margin*4)+'px';
 if(payload.error){box.innerHTML='<div style="width:170px;height:170px;display:grid;place-items:center;color:#8b94a7;font-size:12px;text-align:center;padding:15px">Your QR preview will appear here.</div>';currentValue='';$('#downloadBtn').disabled=true;$('#downloadBtn').style.opacity='.5';return}
 if(typeof QRCode==='undefined'){box.innerHTML='<p style="color:#b44;padding:18px;text-align:center">QR library did not load. Check your connection and refresh.</p>';return}
 currentValue=payload.value;
 try{qr=new QRCode(box,{text:payload.value,width:state.size,height:state.size,colorDark:state.fg,colorLight:state.bg,correctLevel:correction()});$('#downloadBtn').disabled=false;$('#downloadBtn').style.opacity='1'}catch(e){box.innerHTML='<p style="padding:16px;color:#b44">This content is too large to encode. Shorten it and try again.</p>';currentValue=''}
}
function downloadCanvas(){const source=$('#qrcode').querySelector('canvas');if(!source)return null;const inset=state.margin*4;const canvas=document.createElement('canvas');canvas.width=state.size+inset*2;canvas.height=state.size+inset*2;const ctx=canvas.getContext('2d');ctx.fillStyle=state.bg;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.imageSmoothingEnabled=false;ctx.drawImage(source,inset,inset,state.size,state.size);return canvas}
function download(){if(!currentValue){showToast('Complete the fields first.');return}const c=downloadCanvas();if(!c){showToast('QR preview is not ready yet.');return}const a=document.createElement('a');a.download='qr-studio-'+state.type+'-'+Date.now()+'.png';a.href=c.toDataURL('image/png');a.click();const values=getValues();history.unshift({id:Date.now(),type:state.type,value:currentValue,caption:$('#previewCaption').textContent,values,settings:{size:state.size,fg:state.fg,bg:state.bg,ecc:state.ecc,margin:state.margin},created:new Date().toISOString()});history=history.filter((x,i,arr)=>arr.findIndex(y=>y.value===x.value&&JSON.stringify(y.settings)===JSON.stringify(x.settings))===i).slice(0,8);saveHistory();renderHistory();showToast('PNG downloaded · saved to recent creations')}
function renderHistory(){const host=$('#historyList');$('#historyCount').textContent=history.length;host.innerHTML=history.length?history.map(item=>'<div class="history-item"><div class="history-thumb" id="thumb-'+item.id+'"></div><div class="history-info"><strong>'+esc(item.caption||item.type.toUpperCase())+'</strong><small>'+esc(item.type.toUpperCase())+' · '+new Date(item.created).toLocaleDateString()+'</small></div><button class="history-load" data-load="'+item.id+'">Load ↗</button></div>').join(''):'<div class="empty-history"><span>◌</span><p>Your next great QR code starts here.</p><small>Generated codes will appear here.</small></div>';
 history.forEach(item=>{const host=$('#thumb-'+item.id);if(!host||typeof QRCode==='undefined')return;try{new QRCode(host,{text:item.value,width:38,height:38,colorDark:item.settings?.fg||'#111827',colorLight:item.settings?.bg||'#ffffff',correctLevel:QRCode.CorrectLevel.M})}catch{}});
 host.querySelectorAll('[data-load]').forEach(btn=>btn.addEventListener('click',()=>loadHistory(Number(btn.dataset.load))));
}
function loadHistory(id){const item=history.find(x=>x.id===id);if(!item)return;state.type=item.type;$$('.type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===state.type));renderFields(item.type,item.values||{});const s=item.settings||defaults;$('#size').value=s.size||280;$('#fg').value=s.fg||defaults.fg;$('#bg').value=s.bg||defaults.bg;$('#ecc').value=s.ecc||'M';$('#margin').value=s.margin??2;$$('.preset').forEach(b=>b.classList.toggle('active',presets[b.dataset.preset]?.fg===$('#fg').value&&presets[b.dataset.preset]?.bg===$('#bg').value));update();showToast('Creation loaded into the editor')}
function applyPreset(name){const p=presets[name];if(!p)return;$('#fg').value=p.fg;$('#bg').value=p.bg;$$('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));update()}
$$('.type-btn').forEach(btn=>btn.addEventListener('click',()=>{state.type=btn.dataset.type;$$('.type-btn').forEach(b=>b.classList.toggle('active',b===btn));renderFields(state.type);update()}));
$$('.preset').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
['size','fg','bg','ecc','margin'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='fg'||id==='bg')$$('.preset').forEach(b=>b.classList.remove('active'));update()}));
$('#resetBtn').addEventListener('click',()=>{Object.assign(state,defaults);$('#size').value=defaults.size;$('#fg').value=defaults.fg;$('#bg').value=defaults.bg;$('#ecc').value=defaults.ecc;$('#margin').value=defaults.margin;$$('.preset').forEach(b=>b.classList.toggle('active',b.dataset.preset==='classic'));renderFields(state.type);update();showToast('Appearance reset')});
$('#downloadBtn').addEventListener('click',download);
$('#copyBtn').addEventListener('click',async()=>{if(!currentValue){showToast('Complete the fields first.');return}try{await navigator.clipboard.writeText(currentValue);showToast('Destination copied to clipboard')}catch{showToast('Clipboard access unavailable in this browser')}});
$('#clearHistory').addEventListener('click',()=>{if(!history.length)return;history=[];saveHistory();renderHistory();showToast('Recent creations cleared')});
$('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem('qr-studio-theme',document.body.classList.contains('dark')?'dark':'retro')}catch{}});
try{if(localStorage.getItem('qr-studio-theme')==='dark')document.body.classList.add('dark')}catch{}
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();download()}});
renderFields(state.type);renderHistory();update();
window.QRStudioTest={buildPayload,contrast,defaults,types,presets,getValues};
})();