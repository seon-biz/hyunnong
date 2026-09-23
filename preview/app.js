const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('mobile-nav');
function closeMenu(){if(!menu)return;menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.textContent='메뉴';}
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'닫기':'메뉴';menu.hidden=!open;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu&&!menu.hidden){closeMenu();toggle.focus();}});
matchMedia('(min-width: 900px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

const archive=document.querySelector('[data-archive]');
const params=new URLSearchParams(location.search);
const query=(params.get('q')||'').trim().slice(0,120);
if(archive && query) {
  const input=document.getElementById('article-search');input.value=query;
  const escape = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=value=>value.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,' ').trim();
  try {
    const response=await fetch('/search-index.json');if(!response.ok)throw Error('Search unavailable');
    const posts=await response.json(),category=archive.dataset.category;
    const words=normalize(query).split(' ');
    const matches=posts.filter(post=>(!category||post.category===category)&&words.every(word=>normalize(post.searchText).includes(word)));
    const size=Number(archive.dataset.pageSize),total=Math.ceil(matches.length/size);
    const requested=Number(params.get('page')),page=Number.isInteger(requested)&&requested>0?Math.min(requested,Math.max(1,total)):1;
    document.getElementById('result-count').textContent=`“${query}” 검색 결과 ${matches.length}편`;
    document.getElementById('empty-results').hidden=matches.length!==0;
    document.getElementById('post-list').innerHTML=matches.slice((page-1)*size,page*size).map(p=>`<li><a class="post-row" href="/blog/${encodeURIComponent(p.slug)}/"><div class="post-copy"><span class="post-category">${escape(p.categoryLabel)}</span><h2>${escape(p.title)}</h2><p>${escape(p.summary)}</p><div class="post-meta">현농푸드랩 · 원고 예시</div></div><img class="post-thumbnail" src="/assets/${encodeURIComponent(p.image)}" alt="${escape(p.alt)}" loading="lazy" width="${p.width}" height="${p.height}"></a></li>`).join('');
    const href=p=>`${archive.dataset.base}?${new URLSearchParams({q:query,page:String(p)})}`;
    const pages=[...new Set([1,total,...Array.from({length:5},(_,i)=>page+i-2).filter(p=>p>=1&&p<=total)])].filter(p=>p>0).sort((a,b)=>a-b);
    let last=0;
    document.getElementById('pagination').innerHTML=total>1?`<nav class="pagination" aria-label="검색 결과 페이지">${page>1?`<a href="${escape(href(page-1))}" aria-label="이전 페이지">←</a>`:''}${pages.map(p=>{const gap=last&&p-last>1?'<span class="page-gap">…</span>':'';last=p;return `${gap}<a href="${escape(href(p))}" aria-label="${p}페이지" ${p===page?'aria-current="page"':''}>${p}</a>`;}).join('')}${page<total?`<a href="${escape(href(page+1))}" aria-label="다음 페이지">→</a>`:''}</nav>`:'';
  } catch(error) {
    document.getElementById('result-count').textContent='검색을 불러오지 못했습니다. 아래 글 목록을 이용해 주세요.';
  }
}
