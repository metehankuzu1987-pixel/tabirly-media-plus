export const config = { runtime: 'edge' };
const json = (d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json'}});
export default async function handler(req){
  try{
    if(req.method!=='POST') return json({error:'Method not allowed'},405);
    const { model='gpt-image-1', size='1024x1024', prompt='' } = await req.json();
    if(!process.env.OPENAI_API_KEY) return json({error:'OPENAI_API_KEY missing'},500);
    if(!prompt) return json({error:'prompt required'},400);
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST',
      headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body: JSON.stringify({ model, prompt, size })
    });
    if(!r.ok){ return json({error:'upstream_error', details: await r.text().catch(()=>r.statusText)}, r.status); }
    const data = await r.json();
    const url = data?.data?.[0]?.url || '';
    if(!url) return json({error:'no_image_url'},502);
    return json({ url });
  }catch(e){ return json({error:String(e)},500); }
}
