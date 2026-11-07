#!/usr/bin/env node
/* Main-site + members demo i18n completeness: every English key exists in all site languages (incl. Burmese). */
const fs=require('fs'),path=require('path');global.window=global;global.I18N={};
const dir=path.join(__dirname,'../js/i18n');for(const f of fs.readdirSync(dir))eval(fs.readFileSync(path.join(dir,f),'utf8'));
const en=I18N.en,bad=[];
for(const l of Object.keys(I18N)){for(const k of Object.keys(en)){const v=I18N[l][k];if(v==null||v==='')bad.push(l+': missing '+k);else if(Array.isArray(en[k])&&en[k].length!==v.length)bad.push(l+': length '+k);}}
console.log(Object.keys(I18N).length+' site languages, '+Object.keys(en).length+' keys');
if(bad.length){console.log(bad.join('\n'));process.exit(1);}console.log('OK');
