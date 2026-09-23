import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
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
const storeProduct = store; // [확인 필요] 스마트스토어 바른쌀 누룽지 상품 상세 URL
const instagram = 'https://www.instagram.com/hnfoodlab/';
const coupang = 'https://shop.coupang.com/hnfoodlab';
const kakao = 'https://store.kakao.com/hnfoodlab';
const consumerLine = '061-393-3013';
const todo = label => `<span class="needs-info">[확인 필요${label?`: ${label}`:''}]</span>`;
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const postUrl = p => `/blog/${p.slug}/`;
const categoryUrl = k => `/blog/category/${k}/`;
const pageUrl = (base, page) => page === 1 ? base : `${base}page/${page}/`;
const dimensions = {'hero-pour.jpg':[1720,2150], 'product-main.jpg':[1720,1146], 'use-breakfast.jpg':[1146,1146], 'rice-two-varieties.jpg':[1720,1147], 'portable-flatlay.jpg':[1720,1720]};
const picture = (p, cls='', priority=false) => `<img class="${cls}" src="/assets/${e(p.image)}" alt="${e(p.alt)}" width="${dimensions[p.image][0]}" height="${dimensions[p.image][1]}" ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
const hasAsset = name => existsSync(join(output, 'assets', name));
const media = (name, alt, cls='', priority=false) => {
  if(!hasAsset(name)) return `<div class="asset-slot ${cls}" role="img" aria-label="${e(alt)}"><span>이미지 준비 중</span><code>${e(name)}</code></div>`;
  const size = dimensions[name] ? `width="${dimensions[name][0]}" height="${dimensions[name][1]}"` : '';
  return `<img class="${cls}" src="/assets/${e(name)}" alt="${e(alt)}" ${size} ${priority?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
};
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
const footer = () => `<footer class="site-footer"><div class="wrap footer-inner"><div class="footer-intro"><a class="footer-logo" href="/" aria-label="현농푸드랩 홈"><img src="/assets/hyunnong-logo-white.png" alt="현농푸드랩" width="2408" height="459"></a><p>바른쌀 누룽지의 원료부터 먹는 방법까지.</p></div><nav class="footer-site-nav" aria-label="사이트 안내">${navLinks()}</nav><nav class="footer-channel-nav" aria-label="외부 채널">${external(store,'스마트스토어')}${external(instagram,'인스타그램')}<span class="footer-channel-sub">${external(coupang,'쿠팡')}${external(kakao,'카카오톡딜')}</span></nav></div><div class="wrap footer-legal"><p>주식회사 현농푸드랩 <span aria-hidden="true">·</span> 대표 ${todo()} <span aria-hidden="true">·</span> 사업자등록번호 ${todo()} <span aria-hidden="true">·</span> 주소 ${todo('전남 장성 상세주소')} <span aria-hidden="true">·</span> 소비자상담실 <a href="tel:${consumerLine.replace(/-/g,'')}">${consumerLine}</a></p><p class="footer-copyright">© 2026 Hyunnong Food Lab. All rights reserved.</p></div></footer>`;
const layout = (title, content, active='blog', meta={}) => withBase(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${e(meta.description || '현농푸드랩 블로그 디자인 미리보기')}"><title>${meta.title ? e(meta.title) : `${e(title)} · 현농푸드랩`}</title>${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ''}<link rel="icon" href="/assets/ci-hyunnong-compact.png"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><link rel="stylesheet" href="/styles-v3.css?v=5"><script>window.__BASE__=${JSON.stringify(basePath)}</script><script type="module" src="/app.js?v=5"></script></head><body>${header(active)}${content}${footer()}</body></html>`);
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
const storeCta = (label, cls='button') => external(storeProduct, label, cls);

// M1 히어로 — C-HERO
const mainHero = () => `<section class="feature"><div class="wrap feature-inner"><div class="feature-copy"><span class="hero-kicker">HYUNNONG FOOD LAB</span><span class="category-label is-static">바른쌀 누룽지</span><h1>뜨거운 물 붓고 3분이면 완성되는<br>국산 유기농쌀 100% 즉석 누룽지</h1><p>유기가공식품 인증까지 받은 쌀로 만들었습니다. 쌀 품종과 배합비까지 공개합니다.</p><div class="hero-actions">${storeCta('스마트스토어에서 구매')}<a class="text-link" href="/products/barunssal/">바른쌀 누룽지 자세히 보기 <span aria-hidden="true">→</span></a></div></div></div><figure class="feature-photo">${media('hero-pour.jpg','흰 그릇에 담긴 바른쌀 즉석 누룽지에 뜨거운 물을 붓는 모습','',true)}</figure></section>`;

// M2 핵심 가치 — C-STRIP (번호형 3개, 이미지 없음)
const valueStrip = () => {
  const items = [
    {title:'유기농쌀 100%', copy:'국산 유기농쌀만 씁니다. 설탕·소금 없이, 튀기지 않았습니다.'},
    {title:'끓일 필요 없습니다', copy:'뜨거운 물 붓고 3분. 냄비도 불도 필요 없습니다.'},
    {title:'쌀 품종까지 공개', copy:'하이아미 70% + 천지향5세 30%. 배합비까지 숫자로 밝힙니다.'},
  ];
  return `<section class="reading-guide"><div class="wrap reading-guide-inner"><header><span class="eyebrow">HOW WE MAKE IT</span><h2>이렇게 만들었습니다</h2></header><ol>${items.map((item,i)=>`<li><div class="strip-static"><span>0${i+1}</span><div><h3>${e(item.title)}</h3><p>${e(item.copy)}</p></div></div></li>`).join('')}</ol></div></section>`;
};

// M3 제품 요약 — C-BANNER
const productBanner = () => `<section class="brand-feature"><div class="wrap brand-feature-inner"><figure>${media('product-main.jpg','바른쌀 즉석 누룽지 단상자와 개별 포장 파우치')}</figure><div class="brand-feature-copy"><img class="product-wordmark" src="/assets/wordmark-barunssal.png" alt="바른쌀" width="2047" height="626" loading="lazy"><span class="eyebrow">BARUNSSAL NURUNGJI</span><h2>국산 유기농쌀로 만든<br>바른쌀 즉석 누룽지</h2><p>한 봉씩 개별 포장해 필요한 만큼 꺼내 드실 수 있습니다. 실온에서 12개월 보관됩니다.</p><dl class="brand-facts"><div><dt>한 봉</dt><dd>40g</dd></div><div><dt>열량</dt><dd>152kcal</dd></div><div><dt>원료</dt><dd>국산 유기농쌀</dd></div></dl><a class="button" href="/products/barunssal/">바른쌀 누룽지 알아보기 <span aria-hidden="true">→</span></a></div></div></section>`;

// M4 신뢰 배너 — 수치 행 (가로 1줄)
const trustBar = () => {
  const facts = [
    {label:'유기가공식품 인증', value:'제15800003호'},
    {label:'', value:'HACCP'},
    {label:'당류', value:'0g'},
    {label:'원재료', value:'유기농쌀(국산) 100%'},
  ];
  return `<section class="trust-bar"><div class="wrap trust-bar-inner"><div class="trust-mark">${media('certification.png','유기가공식품 인증 마크')}</div><ul class="trust-facts">${facts.map(f=>`<li>${f.label?`${e(f.label)} `:''}<b>${e(f.value)}</b></li>`).join('')}</ul></div></section>`;
};

// M5 이런 때 드세요 — C-CARD3
const useCards = () => {
  const cards = [
    {title:'바쁜 아침 한 그릇', copy:'물만 부으면 됩니다. 따뜻한 아침 한 그릇이 3분이면 준비됩니다.', image:'use-breakfast.jpg', alt:'식탁 위 누룽지 한 그릇과 숟가락'},
    {title:'먹어보고 고르는 선물', copy:'한 봉씩 꺼내 드시기 편한 개별 포장. 실온 12개월이라 천천히 드셔도 됩니다.', image:'gift-3box.jpg', alt:'바른쌀 즉석 누룽지 단상자 세 개를 선물 구성으로 놓은 모습'},
    {title:'라면·국물요리에 한 줌', copy:'라면 끓일 때 마지막 1분에 한 줌. 국물에 구수함이 더해집니다.', image:'use-soup.jpg', alt:'라면 냄비에 누룽지를 넣은 모습'},
  ];
  return `<section class="topic-showcase"><div class="wrap"><header class="section-heading"><span class="eyebrow">HOW PEOPLE ENJOY</span><h2>이런 때 드세요</h2></header><div class="topic-grid">${cards.map((card,i)=>`<a class="topic-card" href="/products/barunssal/"><figure>${media(card.image,card.alt)}</figure><div class="topic-card-copy"><span>0${i+1}</span><h3>${e(card.title)}</h3><p>${e(card.copy)}</p><b>바른쌀 누룽지 보기 <span aria-hidden="true">→</span></b></div></a>`).join('')}</div></div></section>`;
};

// M6 만든 사람들 — C-BANNER (좌우 반전)
const aboutBanner = () => `<section class="brand-feature is-reversed"><div class="wrap brand-feature-inner"><figure>${media('about-hyunnong.jpg','현농푸드랩 본사 사옥 전경')}</figure><div class="brand-feature-copy"><span class="eyebrow">ABOUT US</span><h2>20여 년 농업 전문기업이<br>만든 식품</h2><p>친환경 농자재 기업 현농과 농업 경영컨설팅 기업 현농경영연구소가 함께 세운 식품 전문 회사, 현농푸드랩입니다.</p><dl class="brand-facts"><div><dt>현농 설립</dt><dd>2007</dd></div><div><dt>농업인 교육</dt><dd>800회+</dd></div><div><dt>경영컨설팅</dt><dd>3,000회+</dd></div></dl><a class="button" href="/about/">현농푸드랩 소개 <span aria-hidden="true">→</span></a></div></div></section>`;

// M7 처음 읽는 분께 — C-STRIP (발행된 글이 없으면 섹션 전체를 숨긴다)
const publishedPosts = posts.filter(p=>p.published);
const readingStrip = () => {
  const picks = Object.keys(categories).map(key=>publishedPosts.find(p=>p.category===key)).filter(Boolean);
  if(!picks.length) return '';
  return `<section class="reading-guide"><div class="wrap reading-guide-inner"><header><span class="eyebrow">START HERE</span><h2>처음 읽는 분께</h2></header><ol>${picks.map((p,i)=>`<li><a href="${postUrl(p)}"><span>0${i+1}</span><div><small>${categories[p.category]}</small><h3>${e(p.title)}</h3></div><b aria-hidden="true">→</b></a></li>`).join('')}</ol></div></section>`;
};

// M8 최종 CTA
const finalCta = () => `<section class="final-cta"><div class="wrap"><h2>지금 스마트스토어에서 만나보세요</h2>${storeCta('스마트스토어에서 구매')}</div></section>`;

const organizationLd = {
  '@context':'https://schema.org',
  '@type':'Organization',
  name:'주식회사 현농푸드랩',
  telephone:`+82-${consumerLine.slice(1)}`,
  sameAs:[store, instagram, coupang, kakao],
};
const mainPage = () => layout('현농푸드랩', `<main id="main">${mainHero()}${valueStrip()}${productBanner()}${trustBar()}${useCards()}${aboutBanner()}${readingStrip()}${finalCta()}</main>`, 'home', {
  title:'현농푸드랩 | 국산 유기농쌀 100% 바른쌀 즉석 누룽지',
  description:'유기가공식품 인증을 받은 국산 유기농쌀로 만든 즉석 누룽지. 뜨거운 물 3분이면 완성됩니다.',
  jsonLd: organizationLd,
});

function archive(base, items, title, category='', current=1) {
  const slice=items.slice((current-1)*pageSize,current*pageSize);
  const intro=`<div class="archive-heading"><div class="wrap"><span class="eyebrow">HYUNNONG FOOD LAB JOURNAL</span><h1>${e(title)}</h1><p>원료부터 먹는 방법까지, 궁금한 이야기를 찾아보세요.</p></div></div>`;
  const listHeading='';
  const side=sidebar();
  return layout(title,`<main id="main">${intro}<div class="wrap archive-columns"><section class="archive-main" aria-label="글 목록" data-archive data-category="${category}" data-page-size="${pageSize}" data-base="${base}">${listHeading}${filters(category)}<div class="archive-toolbar"><p id="result-count" aria-live="polite">${e(title)} <span>${items.length}</span></p><form class="search-form" role="search" action="${category?categoryUrl(category):'/blog/'}"><label class="sr-only" for="article-search">블로그 글 검색</label><input type="search" id="article-search" name="q" placeholder="궁금한 내용을 검색해 보세요" maxlength="120" autocomplete="off"><button type="submit">검색</button></form></div><ul class="post-list" id="post-list">${slice.map(postRow).join('')}</ul><div id="empty-results" class="empty-results" hidden><h2>검색 결과가 없습니다.</h2><p>다른 검색어를 입력하거나 전체 글을 살펴보세요.</p><a class="text-link" href="${category?categoryUrl(category):'/blog/'}">검색 초기화 →</a></div><div id="pagination">${pagination(base,current,Math.ceil(items.length/pageSize))}</div><noscript><p class="preview-note">검색은 자바스크립트가 필요합니다. 주제와 페이지 링크로도 글을 읽을 수 있습니다.</p></noscript></section>${side}</div></main>`);
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
await save('/',mainPage());
for(let page=1;page<=Math.max(1,Math.ceil(posts.length/pageSize));page++)await save(pageUrl('/blog/',page),archive('/blog/',posts,'전체 글','',page));
for(const [category,label] of Object.entries(categories)) {
  const items=posts.filter(p=>p.category===category),base=categoryUrl(category);
  for(let page=1;page<=Math.max(1,Math.ceil(items.length/pageSize));page++)await save(pageUrl(base,page),archive(base,items,label,category,page));
}
for(const p of posts) await save(postUrl(p),article(p));
await save('/products/barunssal/',productPage());
await save('/about/',aboutPage());
await writeFile(join(output,'search-index.json'),JSON.stringify(posts.map(p=>({...p,categoryLabel:categories[p.category],width:dimensions[p.image][0],height:dimensions[p.image][1],searchText:[p.title,p.summary,...p.points].join(' ')}))));
await writeFile(join(output,'404.html'),layout('페이지를 찾을 수 없습니다',`<main id="main" class="read empty-results"><h1>페이지를 찾을 수 없습니다.</h1><p>글 목록에서 필요한 이야기를 찾아보세요.</p><a class="button" href="/blog/">블로그로 돌아가기</a></main>`));
await writeFile(join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log(`Built responsive design preview: ${posts.length} sample posts, 3 categories, ${pageSize} posts per page.`);
