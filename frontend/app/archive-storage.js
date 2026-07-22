(function(){
  const key='qingshiji-archives';
  const local=()=>{try{const value=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch{return[]}};
  const merge=(a,b)=>{const map=new Map();[...b,...a].forEach(item=>{if(item?.id)map.set(item.id,item)});return[...map.values()].sort((x,y)=>String(y.createdAt||'').localeCompare(String(x.createdAt||'')))};
  async function load(){try{const response=await fetch('./api/archives',{cache:'no-store'});if(!response.ok)throw Error('load');const items=merge(local(),await response.json());localStorage.setItem(key,JSON.stringify(items));return items}catch{return local()}}
  async function save(items=local()){localStorage.setItem(key,JSON.stringify(items));try{const response=await fetch('./api/archives',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(items)});if(!response.ok)throw Error('save');return true}catch{return false}}
  window.QingshiArchiveStorage={load,save,local};
})();
