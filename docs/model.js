(function(root,factory){const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.AnodeflexModel=api})(typeof globalThis!=="undefined"?globalThis:this,function(){
  const NODES=[1,2,3,4];
  const IDS=["11","12","21","22","31","32","41","42"];
  const SIDES={
    A:{voltage:"VA",near:1,far:2,rcNear:"Rc1",rcFar:"Rc2",ids:["11","12","21","22"]},
    B:{voltage:"VB",near:3,far:4,rcNear:"Rc3",rcFar:"Rc4",ids:["31","32","41","42"]}
  };
  const sum=values=>values.reduce((a,b)=>a+b,0);
  const parallel=values=>1/sum(values.map(value=>1/value));

  function finitePositive(value){return Number.isFinite(value)&&value>0}
  function validateSide(input,side,allowZeroVoltage=false){
    const data=SIDES[side],voltage=Number(input[data.voltage]),rcNear=Number(input[data.rcNear]),rcFar=Number(input[data.rcFar]);
    if((allowZeroVoltage?voltage<0:voltage<=0)||!Number.isFinite(voltage)||!Number.isFinite(rcNear)||rcNear<0||!Number.isFinite(rcFar)||rcFar<0)throw new Error("invalid-input");
    return {data,voltage,rcNear,rcFar};
  }

  function dimensionSide(input,side){
    const {data,voltage,rcNear,rcFar}=validateSide(input,side),currents=input.currents;
    if(data.ids.some(id=>!finitePositive(currents[id])))throw new Error("invalid-input");
    const nearIds=data.ids.slice(0,2),farIds=data.ids.slice(2),iFar=sum(farIds.map(id=>currents[id])),iTotal=iFar+sum(nearIds.map(id=>currents[id]));
    const vNear=voltage-iTotal*rcNear,vFar=vNear-iFar*rcFar;
    if(vNear<=0||vFar<=0){const error=new Error("voltage-exhausted");error.side=side;throw error}
    const fixed={};nearIds.forEach(id=>fixed[id]=vNear/currents[id]);farIds.forEach(id=>fixed[id]=vFar/currents[id]);
    return {voltage,voltages:{[data.near]:vNear,[data.far]:vFar},trunks:{[data.near]:iTotal,[data.far]:iFar},fixed,It:iTotal,cables:{[data.near]:rcNear,[data.far]:rcFar}};
  }

  function dimension(input){
    const a=dimensionSide(input,"A"),b=dimensionSide(input,"B");
    return {VA:a.voltage,VB:b.voltage,currents:{...input.currents},fixed:{...a.fixed,...b.fixed},voltages:{...a.voltages,...b.voltages},trunks:{...a.trunks,...b.trunks},cables:{...a.cables,...b.cables},sides:{A:a,B:b},It:a.It+b.It};
  }

  function simulate(input){
    const V=Number(input.V),cables=Object.fromEntries(NODES.map(node=>[node,Number(input["Rc"+node])]));
    if(!Number.isFinite(V)||V<0||NODES.some(node=>!Number.isFinite(cables[node])||cables[node]<0))throw new Error("invalid-input");
    const branch=Object.fromEntries(IDS.map(id=>[id,Number(input.fixed[id])+Math.max(0,Number(input.rheostats[id])||0)]));
    if(IDS.some(id=>!finitePositive(branch[id])))throw new Error("invalid-resistance");
    const equivalents={},downstreamPaths={};
    for(let node=4;node>=1;node--){const paths=[branch[node+"1"],branch[node+"2"]];if(node<4){downstreamPaths[node]=cables[node+1]+equivalents[node+1];paths.push(downstreamPaths[node])}equivalents[node]=parallel(paths)}
    const Rt=cables[1]+equivalents[1],It=V/Rt,currents={},voltages={},trunks={1:It};let incoming=It,voltage=V-incoming*cables[1];
    for(const node of NODES){voltages[node]=voltage;currents[node+"1"]=voltage/branch[node+"1"];currents[node+"2"]=voltage/branch[node+"2"];if(node<4){incoming=voltage/downstreamPaths[node];trunks[node+1]=incoming;voltage-=incoming*cables[node+1]}}
    const pCable=sum(NODES.map(node=>trunks[node]**2*cables[node])),pBranches=sum(IDS.map(id=>currents[id]**2*branch[id])),pSource=V*It;
    return {V,fixed:{...input.fixed},rheostats:{...input.rheostats},branch,currents,voltages,trunks,cables,equivalents,downstreamPaths,Rt,It,pCable,pBranches,pSource,pError:pSource-pCable-pBranches};
  }

  function adjust(input){
    const V=Number(input.V),cables=Object.fromEntries(NODES.map(node=>[node,Number(input["Rc"+node])])),targets=input.targets;
    if(!finitePositive(V)||!finitePositive(input.maxReo)||NODES.some(node=>!Number.isFinite(cables[node])||cables[node]<0)||IDS.some(id=>!finitePositive(targets[id])))throw new Error("invalid-target");
    const trunks=Object.fromEntries(NODES.map(node=>[node,sum(IDS.filter(id=>Number(id[0])>=node).map(id=>targets[id]))])),voltages={};let voltage=V;
    for(const node of NODES){voltage-=trunks[node]*cables[node];voltages[node]=voltage;if(voltage<=0)return {feasible:false,reason:"voltage",voltages,trunks}}
    const rheostats=Object.fromEntries(IDS.map(id=>[id,voltages[Number(id[0])]/targets[id]-input.fixed[id]])),negative=IDS.filter(id=>rheostats[id]<-1e-8),over=IDS.filter(id=>rheostats[id]>input.maxReo+1e-8);
    return {feasible:negative.length===0&&over.length===0,voltages,trunks,rheostats,negative,over};
  }

  return {NODES,IDS,SIDES,dimension,simulate,adjust};
});
