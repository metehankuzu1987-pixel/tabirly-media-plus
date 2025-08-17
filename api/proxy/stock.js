export const config = { runtime: 'edge' };
const json = (d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json'}});
export default async function handler(req){
  try{
    if(req.method!=='POST') return json({error:'Method not allowed'},405);
    const { provider, q='', orientation='landscape', color='', count=9 } = await req.json();
    const n = Math.max(1, Math.min(24, Number(count)||9));
    if(provider==='unsplash'){
      if(!process.env.UNSPLASH_KEY) return json({items:[],warning:'UNSPLASH_KEY missing'});
      const url=`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=${n}&orientation=${orientation}${color?`&color=${encodeURIComponent(color)}`:''}`;
      const r=await fetch(url,{headers:{Authorization:`Client-ID ${process.env.UNSPLASH_KEY}`}}); if(!r.ok) return json({items:[],error:'unsplash_failed',status:r.status});
      const d=await r.json(); return json({items:(d.results||[]).map(p=>({type:'image',thumb:p.urls.small,url:p.urls.raw+'&auto=format&fit=crop&w=2048',credit:p.user?.name||'Unsplash'}))});
    }
    if(provider==='pexels'){
      if(!process.env.PEXELS_KEY) return json({items:[],warning:'PEXELS_KEY missing'});
      const r=await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${n}&orientation=${orientation}`,{headers:{Authorization:process.env.PEXELS_KEY}});
      if(!r.ok) return json({items:[],error:'pexels_failed',status:r.status});
      const d=await r.json(); return json({items:(d.photos||[]).map(p=>({type:'image',thumb:p.src?.medium,url:p.src?.large2x||p.src?.original,credit:p.photographer||'Pexels'}))});
    }
    if(provider==='pexels_video'){
      if(!process.env.PEXELS_KEY) return json({items:[],warning:'PEXELS_KEY missing'});
      const r=await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(q)}&per_page=${n}&orientation=${orientation}`,{headers:{Authorization:process.env.PEXELS_KEY}});
      if(!r.ok) return json({items:[],error:'pexels_video_failed',status:r.status});
      const d=await r.json(); return json({items:(d.videos||[]).map(v=>({type:'video',thumb:v.video_pictures?.[0]?.picture||'',url:(v.video_files||[]).find(f=>f.quality==='hd')?.link||v.video_files?.[0]?.link||'',credit:v.user?.name||'Pexels'}))});
    }
    return json({items:[]});
  }catch(e){ return json({items:[],error:String(e)},500); }
}
