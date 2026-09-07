// Stubs mínimos do Apps Script para validar o motor de cálculo
const props = {PLANILHA_ID:'x', SEGREDO:'s'};
global.PropertiesService = { getScriptProperties: () => ({ getProperty: k=>props[k], setProperty:(k,v)=>props[k]=v }) };
const cacheStore = {};
global.CacheService = { getScriptCache: () => ({ get:k=>cacheStore[k]||null, put:(k,v)=>cacheStore[k]=v, remove:k=>delete cacheStore[k] }) };
global.Logger = { log: (...a)=>console.log('LOG:',...a) };
global.Session = { getEffectiveUser: () => ({ getEmail: () => 'x@y.z' }) };
global.LockService = { getScriptLock: () => ({ tryLock:()=>true, releaseLock:()=>{} }) };
global.Utilities = {
  formatDate(d, tz, fmt){
    const p=n=>String(n).padStart(2,'0');
    if(fmt==='yyyy-MM-dd') return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;
    if(fmt==='dd/MM/yyyy') return `${p(d.getDate())}/${p(d.getMonth()+1)}/${d.getFullYear()}`;
    return d.toISOString();
  },
  getUuid:()=>'uuid',
  computeHmacSha256Signature:(msg,key)=>Array.from(require('crypto').createHmac('sha256',key).update(msg).digest()),
  base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),
  base64DecodeWebSafe:s=>Array.from(Buffer.from(s,'base64url')),
  newBlob:(b)=>({getDataAsString:()=>Buffer.from(b).toString('utf8')})
};
// planilha fake
function Sheet(name, header){ this.name=name; this.rows=[header.slice()]; }
Sheet.prototype.getLastRow=function(){ return this.rows.length; };
Sheet.prototype.getMaxRows=function(){ return this.rows.length; };
Sheet.prototype.getRange=function(r,c,nr,nc){ const sh=this;
  nr=nr||1; nc=nc||1;
  return { getValues(){ const o=[]; for(let i=0;i<nr;i++){ const row=sh.rows[r-1+i]||[]; const x=[]; for(let j=0;j<nc;j++) x.push(row[c-1+j]===undefined?'':row[c-1+j]); o.push(x);} return o; },
           setValue(v){ if(!sh.rows[r-1]) sh.rows[r-1]=[]; sh.rows[r-1][c-1]=v; return this; },
           setValues(v){ v.forEach((row,i)=>{ if(!sh.rows[r-1+i]) sh.rows[r-1+i]=[]; row.forEach((cell,j)=>sh.rows[r-1+i][c-1+j]=cell); }); return this; },
           setBackground(){return this;}, setFontWeight(){return this;}, setFontColor(){return this;}, setVerticalAlignment(){return this;} };
};
Sheet.prototype.appendRow=function(r){ this.rows.push(r); };
const sheets={};
global.SpreadsheetApp={ openById:()=>({
  getSheetByName:n=>sheets[n], insertSheet:n=>(sheets[n]=new Sheet(n,[])), getUrl:()=>'http://planilha',
  getSheets:()=>Object.values(sheets), setSpreadsheetTimeZone(){} }) };
global.MailApp={sendEmail(){}}; global.UrlFetchApp={fetch(){return{getResponseCode:()=>200,getContentText:()=>''}}};
global.ScriptApp={getService:()=>({getUrl:()=>'http://app/exec'}),getProjectTriggers:()=>[]};
global.CalendarApp={};
global.HtmlService={};
module.exports={sheets,Sheet};
