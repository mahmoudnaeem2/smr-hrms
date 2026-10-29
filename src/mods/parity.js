const {pe_calc}=require('./payroll_engine.js');const cases=require('./cases.json');
const A={ins:{min:1000,max:5000,emp:"0.10",er:"0.20"},tax:{exempt:0,insDed:true,brackets:[{upto:10000,rate:"0.00"},{upto:20000,rate:"0.10"},{upto:null,rate:"0.20"}]}};
const B={ins:{min:2700,max:16700,emp:"0.11",er:"0.1875"},tax:{exempt:15000,insDed:false,brackets:[{upto:40000,rate:"0.00"},{upto:55000,rate:"0.10"},{upto:70000,rate:"0.15"},{upto:200000,rate:"0.20"},{upto:null,rate:"0.225"}]}};
let bad=0;for(const c of cases){const r=pe_calc(c.comps,c.rules==="A"?A:B,c.other);for(const k of Object.keys(c.exp)){if(r[k]!==c.exp[k]){bad++;if(bad<4)console.log("MISMATCH",k,r[k],c.exp[k],JSON.stringify(c).slice(0,200))}}}
console.log(cases.length+" cases, mismatches:",bad);process.exit(bad?1:0)
