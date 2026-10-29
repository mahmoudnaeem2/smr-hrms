/* Payroll engine: pure functions, integer cents + BigInt, no statutory values inside.
   Mirrors payroll_engine.py (Decimal). Rates and limits arrive only through `rules`. */
function pe_roundDiv(n,d){return (2n*n+d)/(2n*d)}            // half-up, n>=0, d>0
function pe_micro(r){return BigInt(Math.round(Number(r)*1e6))}
function pe_B(x){return BigInt(Math.round(x))}
function pe_annualTaxNum(annualC,brackets){                   // returns numerator over 1e6 (cents*micro)
  let num=0n,lower=0n;
  for(const b of brackets){
    const upper=b.upto==null?null:pe_B(b.upto*100);
    if(annualC<=lower)break;
    const top=(upper==null||annualC<upper)?annualC:upper;
    num+=(top-lower)*pe_micro(b.rate);
    if(upper==null)break;
    lower=upper;
  }
  return num;
}
/* comps: [{c:cents, taxable:bool, insurable:bool}]
   rules: {ins:{min,max,emp,er}, tax:{exempt,insDed,brackets:[{upto|null,rate}]}}  (min/max/exempt/upto in currency units)
   otherC: other authorised deductions, cents */
function pe_calc(comps,rules,otherC){
  let gross=0n,insBase=0n,taxBase=0n;
  for(const k of comps){const c=pe_B(k.c);gross+=c;if(k.insurable)insBase+=c;if(k.taxable)taxBase+=c}
  const mn=pe_B(rules.ins.min*100),mx=pe_B(rules.ins.max*100);
  const wage=insBase===0n?0n:(insBase<mn?mn:(insBase>mx?mx:insBase));
  const empIns=pe_roundDiv(wage*pe_micro(rules.ins.emp),1000000n);
  const erIns=pe_roundDiv(wage*pe_micro(rules.ins.er),1000000n);
  let taxM=taxBase-(rules.tax.insDed?empIns:0n);if(taxM<0n)taxM=0n;
  let annual=taxM*12n-pe_B(rules.tax.exempt*100);if(annual<0n)annual=0n;
  const tax=pe_roundDiv(pe_annualTaxNum(annual,rules.tax.brackets),12n*1000000n);
  const other=pe_B(otherC||0),net=gross-empIns-tax-other,cost=gross+erIns;
  const N=Number;
  return{gross:N(gross),wage:N(wage),empIns:N(empIns),taxableM:N(taxM),annualTaxable:N(annual),tax:N(tax),other:N(other),net:N(net),erIns:N(erIns),cost:N(cost)};
}
if(typeof module!=="undefined")module.exports={pe_calc,pe_annualTaxNum,pe_micro};
