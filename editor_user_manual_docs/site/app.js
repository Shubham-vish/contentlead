(function(){
  // Client-side search over the prebuilt index.
  var input = document.getElementById('search-input');
  var box = document.getElementById('search-results');
  var index = [];
  fetch('search-index.json').then(function(r){return r.json();}).then(function(d){index=d;});

  function render(results, q){
    if(!q){ box.classList.remove('show'); box.innerHTML=''; return; }
    if(!results.length){ box.innerHTML='<div class="r-empty">No matches for “'+esc(q)+'”</div>'; box.classList.add('show'); return; }
    box.innerHTML = results.slice(0,12).map(function(r){
      var sub = r.hit && r.hit!==r.title ? r.hit : r.label;
      var url = r.anchor ? (r.url+'#'+r.anchor) : r.url;
      return '<a href="'+url+'"><div class="r-title">'+esc(r.title)+'</div><div class="r-sub">'+esc(sub)+'</div></a>';
    }).join('');
    box.classList.add('show');
  }
  function esc(s){return (s||'').replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c];});}
  function slug(s){return s.toLowerCase().replace(/[^\w]+/g,'-').replace(/^-|-$/g,'');}

  function search(q){
    var ql=q.toLowerCase(); var out=[];
    index.forEach(function(p){
      if(p.title.toLowerCase().indexOf(ql)>=0){ out.push({url:p.url,title:p.title,label:p.label,hit:p.title}); return; }
      var h = p.headings.find(function(x){return x.toLowerCase().indexOf(ql)>=0;});
      if(h){ out.push({url:p.url,title:p.title,label:p.label,hit:h,anchor:slug(h)}); return; }
      if(p.label.toLowerCase().indexOf(ql)>=0){ out.push({url:p.url,title:p.title,label:p.label,hit:p.label}); }
    });
    return out;
  }

  if(input){
    input.addEventListener('input', function(){ var q=input.value.trim(); render(search(q), q); });
    input.addEventListener('keydown', function(e){ if(e.key==='Escape'){ input.value=''; render([], ''); input.blur(); }});
    document.addEventListener('click', function(e){ if(!e.target.closest('.search')) box.classList.remove('show'); });
  }

  // Scrollspy for the on-page TOC.
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  if(links.length){
    var map = {};
    links.forEach(function(a){ var id=decodeURIComponent((a.getAttribute('href')||'').split('#')[1]||''); if(id){ var el=document.getElementById(id); if(el) map[id]={a:a,el:el}; }});
    var ids = Object.keys(map);
    function onScroll(){
      var y = window.scrollY + 120; var cur=null;
      ids.forEach(function(id){ if(map[id].el.offsetTop<=y) cur=id; });
      links.forEach(function(a){a.classList.remove('active');});
      if(cur && map[cur]) map[cur].a.classList.add('active');
    }
    window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
  }
})();
