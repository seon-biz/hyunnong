import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'preview');
const config = JSON.parse(await readFile(join(root, 'content/preview-posts.json'), 'utf8'));
const posts = config.posts;
const basePath = (process.env.BASE_PATH || "").replace(/\/+$/, "");
const withBase = html => basePath ? html.replace(/(href|src|action|data-base)="\//g, `$1="${basePath}/`) : html;
const categories = {preparation:'먹는 법', ingredients:'원료·구성', storage:'보관·활용'};
const pageSize = 8;
const store = 'https://smartstore.naver.com/hnfoodlab';
const instagram = 'https://www.instagram.com/hnfoodlab/';
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const postUrl = p => `/blog/${p.slug}/`;
const categoryUrl = k => `/blog/category/${k}/`;
const pageUrl = (base, page) => page === 1 ? base : `${base}page/${page}/`;
const dimensions = {'hero-pour.jpg':[1720,2150], 'product-main.jpg':[1720,1146], 'use-breakfast.jpg':[1146,1146], 'rice-two-varieties.jpg':[1720,1147], 'portable-flatlay.jpg':[1720,1720]};
const picture = (p, cls='', priority=false) => `<img class="${cls}" src="/assets/${e(p.image)}" alt="${e(p.alt)}" width="${dimensions[p.image][0]}" height="${dimensions[p.image][1]}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
const chip = p => `<a class="category-label" href="${categoryUrl(p.category)}">${categories[p.category]}</a>`;
const external = (url,label,cls='') => `<a class="${cls}" href="${url}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true"> ↗</span></a>`;
const navItems = [
  {key:'home', href:'/', label:'메인'},
  {key:'about', href:'/about/', label:'브랜드 소개'},
  {key:'product', href:'/products/barunssal/', label:'제품 소개'},
  {key:'blog', href:'/blog/', label:'블로그'},
];
const navLinks = (active='') => navItems.map(item=>`<a href="${item.href}" ${active===item.key?'aria-current="page"':''}>${item.label}</a>`).join('');
const header = active => `<a class="skip-link" href="#main">본문으로 건너뛰기</a><div class="utility-bar"><div class="wrap utility-inner"><p>쌀 한 톨부터 한 그릇까지, 현농푸드랩의 기록</p><nav aria-label="바로가기">${external(instagram,'인스타그램')}${external(store,'스마트스토어')}</nav></div></div><header class="site-header"><div class="wrap header-inner"><a class="brand" href="/" aria-label="현농푸드랩 홈"><img src="/assets/hyunnong-logo-color.png" alt="현농푸드랩" width="2408" height="459"></a><nav class="desktop-nav" aria-label="주 메뉴">${navLinks(active)}</nav><div class="header-actions">${external(store,'스마트스토어','button store-button')}<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav">메뉴</button></div></div><nav id="mobile-nav" class="mobile-nav" aria-label="모바일 메뉴" hidden>${navLinks(active)}${external(store,'스마트스토어')}</nav></header>`;
const footer = () => `<footer class="site-footer"><div class="wrap footer-inner"><div class="footer-intro"><a class="footer-logo" href="/" aria-label="현농푸드랩 홈"><img src="/assets/hyunnong-logo-white.png" alt="현농푸드랩" width="2408" height="459"></a><p>바른쌀 누룽지의 원료부터 먹는 방법까지.</p></div><nav class="footer-site-nav" aria-label="사이트 안내">${navLinks()}</nav><nav class="footer-channel-nav" aria-label="외부 채널">${external(store,'스마트스토어')}${external(instagram,'인스타그램')}</nav></div><div class="wrap preview-note">디자인 검토용 · 글과 게시 정보는 발행 전 예시입니다.</div></footer>`;
const layout = (title, content, active='blog') => withBase(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="현농푸드랩 블로그 디자인 미리보기"><title>${e(title)} · 현농푸드랩</title><link rel="icon" href="/assets/ci-hyunnong-compact.png"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><link rel="stylesheet" href="/styles-v3.css?v=5"><script>window.__BASE__=${JSON.stringify(basePath)}</script><script type="module" src="/app.js?v=5"></script></head><body>${header(active)}${content}${footer()}</body></html>`);
const postRow = p => `<li><a class="post-row" href="${postUrl(p)}"><div class="post-copy"><span class="post-category">${categories[p.category]}</span><h2>${e(p.title)}</h2><p>${e(p.summary)}</p><div class="post-meta">현농푸드랩 <span aria-hidden="true">·</span> 원고 예시</div></div>${picture(p,'post-thumbnail')}</a></li>`;
const filters = active => `<nav class="category-tabs" aria-label="글 주제"><a href="/blog/" ${!active?'aria-current="page"':''}>전체</a>${Object.entries(categories).map(([k,label])=>`<a href="${categoryUrl(k)}" ${active===k?'aria-current="page"':''}>${label}</a>`).join('')}</nav>`;
const sidebar = () => `<aside class="sidebar"><section class="side-block"><h2>처음 읽는 분께</h2><ol class="reading-list">${[posts[0],posts[1],posts[2]].map((p,i)=>`<li><span class="reading-number">${i+1}</span><a href="${postUrl(p)}">${e(p.title)}<small>${categories[p.category]}</small></a></li>`).join('')}</ol></section><section class="side-block product-side"><span class="eyebrow">현농푸드랩의 바른쌀</span><h2>어떤 상품인지<br>살펴보세요.</h2><img src="/assets/product-main.jpg" alt="바른쌀 누룽지 상자와 개별포장" width="1720" height="1146" loading="lazy"><p>원료, 한 봉의 양, 포장과<br>조리 방법을 모았습니다.</p><a class="text-link" href="/products/barunssal/">바른쌀 알아보기 <span aria-hidden="true">→</span></a></section></aside>`;
function pagination(base,current,total) {
  if(total<=1)return '';
  const positions = [...new Set([1,total,...Array.from({length:5},(_,i)=>current+i-2).filter(p=>p>=1&&p<=total)])].sort((a,b)=>a-b);
  let last=0;
  const links=positions.map(p=>{const gap=last&&p-last>1?'<span class="page-gap">…</span>':'';last=p;return `${gap}<a href="${pageUrl(base,p)}" aria-label="${p}페이지" ${p===current?'aria-current="page"':''}>${p}</a>`;}).join('');
  return `<nav class="pagination" aria-label="글 목록 페이지">${current>1?`<a href="${pageUrl(base,current-1)}" aria-label="이전 페이지">←</a>`:'<span class="page-disabled" aria-hidden="true">←</span>'}${links}${current<total?`<a href="${pageUrl(base,current+1)}" aria-label="다음 페이지">→</a>`:'<span class="page-disabled" aria-hidden="true">→</span>'}</nav>`;
}
const featured = posts.find(p=>p.slug===config.featuredSlug);
const hero = () => `<section class="feature"><div class="wrap feature-inner"><div class="feature-copy"><span class="hero-kicker">HYUNNONG FOOD LAB JOURNAL</span>${chip(featured)}<h1>${e(featured.title)}</h1><p>${e(featured.summary)}</p><div class="hero-actions"><a class="button" href="${postUrl(featured)}">글 읽기 <span aria-hidden="true">→</span></a><a class="text-link" href="/blog/">전체 이야기 보기</a></div></div></div><a class="feature-photo" href="${postUrl(featured)}" aria-label="${e(featured.title)} 읽기"><img src="/assets/hero-pour.jpg" alt="누룽지에 뜨거운 물을 붓는 장면" width="1720" height="2150" fetchpriority="high" decoding="async"><span class="photo-caption">따뜻한 한 그릇을 준비하는 시간</span></a></section>`;
const homeDiscovery = () => {
  const topicData = [
    {key:'preparation', image:'use-breakfast.jpg', width:1146, height:1146, alt:'아침 식탁의 누룽지 한 그릇', copy:'물의 양과 시간, 그릇처럼 한 그릇을 준비할 때 필요한 내용을 살펴봅니다.'},
    {key:'ingredients', image:'rice-two-varieties.jpg', width:1720, height:1147, alt:'두 접시에 나누어 담은 쌀', copy:'쌀과 원재료, 한 봉의 양과 포장에 적힌 정보를 차근차근 읽습니다.'},
    {key:'storage', image:'portable-flatlay.jpg', width:1720, height:1720, alt:'바른쌀 누룽지와 가방 속 소지품', copy:'아침과 사무실, 이동 중에도 살펴볼 보관과 활용 기준을 모았습니다.'}
  ];
  return `<section class="topic-showcase"><div class="wrap"><header class="section-heading"><span class="eyebrow">EXPLORE THE JOURNAL</span><h2>바른쌀을 이해하는<br>세 가지 이야기</h2><p>궁금한 주제부터 천천히 읽어보세요.</p></header><div class="topic-grid">${topicData.map((item,index)=>`<a class="topic-card" href="${categoryUrl(item.key)}"><figure><img src="/assets/${item.image}" alt="${item.alt}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async"></figure><div class="topic-card-copy"><span>0${index+1}</span><h3>${categories[item.key]}</h3><p>${item.copy}</p><b>이 주제 읽기 <span aria-hidden="true">→</span></b></div></a>`).join('')}</div></div></section><section class="brand-feature"><div class="wrap brand-feature-inner"><figure><img src="/assets/product-main.jpg" alt="바른쌀 누룽지 상자와 개별포장" width="1720" height="1146" loading="lazy" decoding="async"></figure><div class="brand-feature-copy"><img class="product-wordmark" src="/assets/wordmark-barunssal.png" alt="바른쌀" width="2047" height="626" loading="lazy"><span class="eyebrow">BARUNSSAL NURUNGJI</span><h2>한 봉을 고르기 전에<br>확인할 내용을 모았습니다.</h2><p>원료와 구성, 포장과 먹는 방법을 한곳에서 살펴보고 현재 판매 정보는 스마트스토어에서 확인하세요.</p><dl class="brand-facts"><div><dt>한 봉</dt><dd>40g</dd></div><div><dt>기본 구성</dt><dd>5봉</dd></div><div><dt>원료</dt><dd>국산 유기농쌀</dd></div></dl><a class="button" href="/products/barunssal/">바른쌀 알아보기 <span aria-hidden="true">→</span></a></div></div></section><section class="reading-guide"><div class="wrap reading-guide-inner"><header><span class="eyebrow">START HERE</span><h2>처음 읽는 분께</h2></header><ol>${[posts[0],posts[1],posts[2]].map((p,i)=>`<li><a href="${postUrl(p)}"><span>0${i+1}</span><div><small>${categories[p.category]}</small><h3>${e(p.title)}</h3></div><b aria-hidden="true">→</b></a></li>`).join('')}</ol></div></section>`;
};
function archive(base, items, title, category='', isHome=false, current=1) {
  const slice=items.slice((current-1)*pageSize,current*pageSize);
  const intro=isHome&&current===1?`${hero()}${homeDiscovery()}`:`<div class="archive-heading"><div class="wrap"><span class="eyebrow">HYUNNONG FOOD LAB JOURNAL</span><h1>${e(title)}</h1><p>원료부터 먹는 방법까지, 궁금한 이야기를 찾아보세요.</p></div></div>`;
  const listHeading=isHome?`<header class="home-list-heading"><span class="eyebrow">LATEST STORIES</span><h2>${current===1?'최근 이야기':'최근 이야기 이어보기'}</h2><p>새로 정리한 바른쌀 이야기를 만나보세요.</p></header>`:'';
  const side=isHome?'':sidebar();
  return layout(title,`<main id="main">${intro}<div class="wrap archive-columns ${isHome?'home-archive':''}"><section class="archive-main" aria-label="글 목록" data-archive data-category="${category}" data-page-size="${pageSize}" data-base="${base}">${listHeading}${filters(category)}<div class="archive-toolbar"><p id="result-count" aria-live="polite">${isHome?'최근 이야기':e(title)} <span>${items.length}</span></p><form class="search-form" role="search" action="${category?categoryUrl(category):'/blog/'}"><label class="sr-only" for="article-search">블로그 글 검색</label><input type="search" id="article-search" name="q" placeholder="궁금한 내용을 검색해 보세요" maxlength="120" autocomplete="off"><button type="submit">검색</button></form></div><ul class="post-list" id="post-list">${slice.map(postRow).join('')}</ul><div id="empty-results" class="empty-results" hidden><h2>검색 결과가 없습니다.</h2><p>다른 검색어를 입력하거나 전체 글을 살펴보세요.</p><a class="text-link" href="${category?categoryUrl(category):'/blog/'}">검색 초기화 →</a></div><div id="pagination">${pagination(base,current,Math.ceil(items.length/pageSize))}</div><noscript><p class="preview-note">검색은 자바스크립트가 필요합니다. 주제와 페이지 링크로도 글을 읽을 수 있습니다.</p></noscript></section>${side}</div></main>`,isHome?'home':'blog');
}
const productCTA=()=>`<aside class="article-cta"><div><span class="eyebrow">바른쌀 누룽지</span><h2>원료와 구성, 더 알아보세요.</h2><p>상품의 기본 정보와 조리 방법을 한곳에 모았습니다.</p></div><a class="button" href="/products/barunssal/">바른쌀 알아보기 →</a></aside>`;
function article(p) {
  const related=posts.filter(x=>x.category===p.category&&x.slug!==p.slug).slice(0,2);
  return layout(p.title,`<main id="main" class="read"><nav class="breadcrumbs" aria-label="현재 위치"><a href="/">메인</a><span aria-hidden="true">/</span><a href="${categoryUrl(p.category)}">${categories[p.category]}</a></nav><article><header class="article-header"><span class="eyebrow">${categories[p.category]}</span><h1>${e(p.title)}</h1><p class="article-meta">현농푸드랩 <span aria-hidden="true">·</span> 디자인 검토용 원고</p></header><p class="answer">${e(p.summary)}</p><figure class="article-photo">${picture(p,'',true)}<figcaption>${e(p.alt)} · 제공 이미지</figcaption></figure><div class="prose"><h2 id="checklist">먼저 확인할 내용</h2><p>제품을 고르거나 준비할 때에는 포장에 적힌 정보와 실제로 사용할 환경을 함께 살펴보세요.</p><ul>${p.points.map(point=>`<li>${e(point)}</li>`).join('')}</ul><h2>포장과 상품 안내를 함께 보세요</h2><p>같은 누룽지라도 제품마다 구성과 조리 방법이 다를 수 있습니다. 바른쌀의 원료와 포장, 기본 조리 안내는 상품 소개에서 확인할 수 있습니다.</p><aside class="source-note"><strong>이 글의 자료</strong><p>현농푸드랩 제공 상세페이지와 제품 이미지로 구성한 원고 예시입니다. 사진을 특정 중량이나 조리 시간의 실측 증거로 사용하지 않습니다.</p></aside></div>${productCTA()}<section class="related-posts"><h2>함께 읽어보세요</h2><ul>${related.map(x=>`<li><span class="post-category">${categories[x.category]}</span><a href="${postUrl(x)}">${e(x.title)} →</a></li>`).join('')}</ul></section></article></main>`);
}
const productPage = () => layout('바른쌀 누룽지',`<main id="main"><section class="wrap product-hero"><div><span class="eyebrow">현농푸드랩</span><h1>바른쌀 누룽지</h1><p class="answer">원료와 포장, 먹는 방법까지.<br>한 봉을 고르기 전에 살펴보세요.</p>${external(store,'스마트스토어에서 보기','button')}</div><img src="/assets/product-main.jpg" alt="바른쌀 누룽지 상자와 개별포장 파우치" width="1720" height="1146"></section><section class="read product-details"><h2>한 봉씩 준비하는 누룽지</h2><p>제공된 제품 표시 기준으로 한 봉 40g, 5봉 구성입니다. 실제 판매 옵션과 가격은 스마트스토어에서 확인할 수 있습니다.</p><dl class="product-facts"><div><dt>기본 구성</dt><dd>40g × 5봉</dd></div><div><dt>원료</dt><dd>국산 유기농쌀</dd></div><div><dt>준비 방법</dt><dd>제품 포장에 적힌 물의 양과 조리 시간 확인</dd></div><div><dt>보관</dt><dd>포장에 표시된 조건과 소비기한 확인</dd></div></dl><h2>더 자세히 읽어보세요</h2><ul class="simple-links">${posts.slice(0,3).map(p=>`<li><a href="${postUrl(p)}">${e(p.title)} →</a></li>`).join('')}</ul></section></main>`,'product');
const aboutPage = () => layout('현농푸드랩 소개',`<main id="main" class="read about"><span class="eyebrow">HYUNNONG FOOD LAB</span><h1>현농푸드랩의<br>누룽지 이야기.</h1><p class="answer">바른쌀 누룽지를 만드는 현농푸드랩이 원료와 구성, 먹는 방법과 일상에서의 활용을 이야기합니다.</p><img class="about-product" src="/assets/product-main.jpg" alt="현농푸드랩의 바른쌀 누룽지" width="1720" height="1146"><div class="prose"><h2>제품을 이해하는 데 필요한 글</h2><p>제품에 표시된 정보와 자료를 바탕으로, 구매 전 궁금한 점과 준비할 때 필요한 내용을 차근차근 정리합니다.</p><h2>현농푸드랩 공식 채널</h2><p>판매 구성과 상품 문의는 스마트스토어에서, 브랜드의 사진과 소식은 인스타그램에서 확인하실 수 있습니다.</p><div class="channel-links">${external(store,'스마트스토어','button')}${external(instagram,'인스타그램','button button-outline')}</div></div></main>`,'about');
async function save(path,html) {const dir=join(output,path);await mkdir(dir,{recursive:true});await writeFile(join(dir,'index.html'),html);}
const seen=new Set();
for(const p of posts){if(!/^[a-z0-9-]+$/.test(p.slug)||seen.has(p.slug)||!categories[p.category])throw Error('Invalid post record');seen.add(p.slug);}
const homePosts=posts.filter(p=>p.slug!==featured.slug);
for(let page=1;page<=Math.max(1,Math.ceil(homePosts.length/pageSize));page++)await save(pageUrl('/',page),archive('/',homePosts,'최근 이야기','',true,page));
for(let page=1;page<=Math.max(1,Math.ceil(posts.length/pageSize));page++)await save(pageUrl('/blog/',page),archive('/blog/',posts,'전체 글','',false,page));
for(const [category,label] of Object.entries(categories)) {
  const items=posts.filter(p=>p.category===category),base=categoryUrl(category);
  for(let page=1;page<=Math.max(1,Math.ceil(items.length/pageSize));page++)await save(pageUrl(base,page),archive(base,items,label,category,false,page));
}
for(const p of posts) await save(postUrl(p),article(p));
await save('/products/barunssal/',productPage());
await save('/about/',aboutPage());
await writeFile(join(output,'search-index.json'),JSON.stringify(posts.map(p=>({...p,categoryLabel:categories[p.category],width:dimensions[p.image][0],height:dimensions[p.image][1],searchText:[p.title,p.summary,...p.points].join(' ')}))));
await writeFile(join(output,'404.html'),layout('페이지를 찾을 수 없습니다',`<main id="main" class="read empty-results"><h1>페이지를 찾을 수 없습니다.</h1><p>글 목록에서 필요한 이야기를 찾아보세요.</p><a class="button" href="/blog/">블로그로 돌아가기</a></main>`));
await writeFile(join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Built responsive design preview: ${posts.length} sample posts, 3 categories, ${pageSize} posts per page.`);
