// 把 data/ 下各街區檔組回原本的資料結構（sys / topics / links / alias）。
(function(){
  const ix = ISLAND.index, P = ISLAND.parts;
  const byS = Object.fromEntries(P.map(p=>[p.sys.id,p]));
  const sysIds = ix.sysOrder.filter(id=>byS[id]).concat(P.map(p=>p.sys.id).filter(id=>!ix.sysOrder.includes(id)));
  const rank = Object.fromEntries(ix.topicOrder.map((id,i)=>[id,i]));
  const topics = P.flatMap(p=>p.topics.map(t=>Object.assign({sys:p.sys.id},t)))
    .map((t,i)=>[t,i]).sort((a,b)=>(rank[a[0].id]??1e6+a[1])-(rank[b[0].id]??1e6+b[1])).map(x=>x[0]);
  window.ISLAND_DATA = { sys: sysIds.map(id=>byS[id].sys), topics, links: ix.links, alias: ix.alias };
})();
