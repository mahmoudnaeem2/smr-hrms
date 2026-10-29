import json,sys
sys.path.insert(0,'/mnt/user-data/outputs')
from payroll_engine import calculate
from decimal import Decimal as D
BR=[{"upto":10000,"rate":"0.00"},{"upto":20000,"rate":"0.10"},{"upto":None,"rate":"0.20"}]
R={"insurance":{"status":"approved","min_wage":1000,"max_wage":5000,"employee_rate":"0.10","employer_rate":"0.20"},"income_tax":{"status":"approved","annual_exemption":0,"insurance_deductible":True,"brackets":BR}}
R2={"insurance":{"status":"approved","min_wage":2700,"max_wage":16700,"employee_rate":"0.11","employer_rate":"0.1875"},"income_tax":{"status":"approved","annual_exemption":15000,"insurance_deductible":False,"brackets":[{"upto":40000,"rate":"0.00"},{"upto":55000,"rate":"0.10"},{"upto":70000,"rate":"0.15"},{"upto":200000,"rate":"0.20"},{"upto":None,"rate":"0.225"}]}}
cases=[]
import random
random.seed(7)
for i in range(300):
    rs=R if i%2 else R2
    n=random.randint(1,3); comps=[]
    for _ in range(n):
        comps.append({"code":"x","amount":D(random.randint(0,5000000))/100,"taxable":random.random()<.8,"insurable":random.random()<.7})
    other=D(random.randint(0,100000))/100
    r=calculate(comps,rs,other)
    cases.append({"rules":"A" if i%2 else "B","comps":[{"c":int(c["amount"]*100),"taxable":c["taxable"],"insurable":c["insurable"]} for c in comps],"other":int(other*100),
      "exp":{"gross":int(r.gross*100),"wage":int(r.insurable_wage*100),"empIns":int(r.employee_insurance*100),"tax":int(r.income_tax*100),"net":int(r.net_pay*100),"erIns":int(r.employer_insurance*100),"cost":int(r.total_employer_cost*100)}})
json.dump(cases,open('cases.json','w'))
print(len(cases))
