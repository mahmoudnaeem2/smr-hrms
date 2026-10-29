/* ===== m18: starting team (placeholder details to be replaced with real ones) ===== */
const SEEDE=[
 {no:"E-0001",name:"Dina El-Azhary",dept:"Management",pos:"Managing Director",mgr:"",srole:"HR Director",basic:60000,allow:15000,hire:"2019-03-01",gender:"Female",mobile:"+20 100 000 0001"},
 {no:"E-0002",name:"Mahmoud Naeem",dept:"Finance",pos:"Finance Manager",mgr:"Dina El-Azhary",srole:"Finance Manager",basic:35000,allow:8000,hire:"2021-09-02",gender:"Male",mobile:"+20 100 000 0002"},
 {no:"E-0003",name:"Hesham Awad",dept:"Human Resources",pos:"HR Specialist",mgr:"Dina El-Azhary",srole:"HR Specialist",basic:18000,allow:3500,hire:"2022-02-14",gender:"Male",mobile:"+20 100 000 0003"},
 {no:"E-0004",name:"Habiba Hassan",dept:"Finance",pos:"Payroll Specialist",mgr:"Dina El-Azhary",srole:"Payroll Specialist",basic:14000,allow:2500,hire:"2023-05-07",gender:"Female",mobile:"+20 100 000 0004"}];
DEPTS.splice(0,DEPTS.length,"Management","Finance","Human Resources");db("depts",[],false).forEach(d=>{if(!DEPTS.includes(d))DEPTS.push(d)});
(function(){try{MODE="mine";localStorage.setItem("smr_mode","mine");if(localStorage.getItem("smr_seed2"))return;
 if(!E.length){["Management","Finance","Human Resources"].forEach(d=>{if(!DEPTS.includes(d))DEPTS.push(d);const D=db("depts",[],false);if(!D.includes(d)&&!["Finance","Human Resources"].includes(d))D.push(d)});sv("depts",false);
  if(!CCS().length){CCS().push({id:"c1",code:"HQ",name:"Head Office",type:"Cost center",on:1});sv("ccs",false)}
  SEEDE.forEach(s=>{const{srole,...e}=s;E.push({...e,loc:"Head Office",type:"Full-time",status:"Active",end:"",project:"Head Office",nat:"Egyptian",coach:"",lapp:"",tapp:"",sched:"Standard (40 h / week)",bank:false});});save();localStorage.setItem("smr_seed_pending","1")}
 localStorage.setItem("smr_seed2","1")}catch(e){}})();
async function seedAccess(){try{if(localStorage.getItem("smr_seed_pending")!=="1")return;localStorage.removeItem("smr_seed_pending");const out=[];
 for(const s of SEEDE){if(!allEmps().some(e=>e.no===s.no))continue;const pw=await mkAccess(s.no),a=ACCT()[akey(s.no)];a.srole=s.srole;out.push({no:s.no,name:s.name+" ("+s.srole+")",pw})}
 sv("acct",false);if(out.length){showCred(out);$("#dd").textContent="Sign in on the first screen with the username shown here (or the employee number). Each person sets a new password at first sign-in. These passwords are shown only now."}}catch(e){}}
