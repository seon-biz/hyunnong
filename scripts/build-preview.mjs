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
const layout = (title, content, active='blog', meta={}) => withBase(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="${e(meta.description || '현농푸드랩 블로그 디자인 미리보기')}"><title>${meta.title ? e(meta.title) : `${e(title)} · 현농푸드랩`}</title>${meta.jsonLd ? `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>` : ''}<link rel="icon" href="/assets/ci-hyunnong-compact.png"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><link rel="stylesheet" href="/styles-v3.css?v=6"><script>window.__BASE__=${JSON.stringify(basePath)}</script><script type="module" src="/app.js?v=6"></script></head><body>${header(active)}${content}${footer()}</body></html>`);
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
    {title:'바쁜 아침 한 그릇', copy:'물만 부으면 됩니다. 따뜻한 아침 한 그릇이 3분이면 준비됩니다.', image:'use-breakfast.jpg', alt:'식탁 위 누룽지 한 그릇과 숟가락', anchor:'#enjoy'},
    {title:'먹어보고 고르는 선물', copy:'한 봉씩 꺼내 드시기 편한 개별 포장. 실온 12개월이라 천천히 드셔도 됩니다.', image:'gift-3box.jpg', alt:'바른쌀 즉석 누룽지 단상자 세 개를 선물 구성으로 놓은 모습', anchor:'#gift'},
    {title:'라면·국물요리에 한 줌', copy:'라면 끓일 때 마지막 1분에 한 줌. 국물에 구수함이 더해집니다.', image:'use-soup.jpg', alt:'라면 냄비에 누룽지를 넣은 모습', anchor:'#enjoy'},
  ];
  return `<section class="topic-showcase"><div class="wrap"><header class="section-heading"><span class="eyebrow">HOW PEOPLE ENJOY</span><h2>이런 때 드세요</h2></header><div class="topic-grid">${cards.map((card,i)=>`<a class="topic-card" href="/products/barunssal/${card.anchor}"><figure>${media(card.image,card.alt)}</figure><div class="topic-card-copy"><span>0${i+1}</span><h3>${e(card.title)}</h3><p>${e(card.copy)}</p><b>바른쌀 누룽지 보기 <span aria-hidden="true">→</span></b></div></a>`).join('')}</div></div></section>`;
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
// ---- 바른쌀 누룽지 제품 페이지 (수정안 v1) ----
const sectionNav = [
  {href:'#howto', label:'드시는 법'},
  {href:'#ingredient', label:'원료'},
  {href:'#nutrition', label:'영양성분'},
  {href:'#product-info', label:'표시사항'},
  {href:'#faq', label:'자주 묻는 질문'},
];
const whyCards = [
  {title:'유기농쌀 100%', copy:'국산 유기농쌀만 씁니다. 설탕도 소금도 넣지 않았고, 기름에 튀기지 않았습니다.'},
  {title:'끓일 필요 없습니다', copy:'뜨거운 물 붓고 3분이면 됩니다. 냄비도 불도 필요 없습니다.'},
  {title:'쌀 품종까지 공개합니다', copy:'하이아미 70% + 천지향5세 30%. 쌀 품종과 배합비까지 숫자로 밝힙니다.'},
  {title:'맛을 시험해 정했습니다', copy:'40명 블라인드 시식으로 배합비를 정하고, 가마솥 원리로 양면을 두 번 구웠습니다.'},
];
const howToSteps = [
  '뜨거운 물 160ml를 붓습니다',
  '3분 기다립니다 (취향에 따라 조절)',
  '구수한 누룽지를 드십니다',
];
const soakLevels = [
  {time:'2분', copy:'바삭함이 살아 있게', image:'soak-2min.jpg', alt:'2분 불린 누룽지, 알갱이가 살아 있는 상태'},
  {time:'3분', copy:'부드럽고 구수하게', image:'soak-3min.jpg', alt:'3분 불린 누룽지, 부드럽게 풀어진 상태'},
  {time:'4분', copy:'죽처럼 담백하게', image:'soak-4min.jpg', alt:'4분 불린 누룽지, 죽처럼 퍼진 상태'},
];
const riceCards = [
  {title:'하이아미 70%', copy:"농촌진흥청이 개발한 품종입니다. 필수아미노산이 일반 쌀보다 많아 '하이(high)+아미(아미노산)'라는 이름이 붙었습니다. 학교급식에 많이 쓰이는 품종입니다."},
  {title:'천지향5세 30%', copy:'구수한 향이 특징인 향미쌀입니다.'}, // 수상 사실은 원출처 확보 후 추가
];
const nutritionRows = [
  {item:'열량', per:'152 kcal', total:'760 kcal'},
  {item:'나트륨', per:'3.44 mg (0%)', total:'17.2 mg'},
  {item:'탄수화물', per:'34 g (10%)', total:'169.4 g'},
  {item:'└ 당류', per:'0 g (0%)', total:'0 g'},
  {item:'지방', per:'0.5 g (1%)', total:'2.4 g'},
  {item:'└ 트랜스지방', per:'0 g', total:'0 g'},
  {item:'└ 포화지방', per:'0.2 g (1%)', total:'0.8 g'},
  {item:'콜레스테롤', per:'0 mg (0%)', total:'0 mg'},
  {item:'단백질', per:'3 g (5%)', total:'15 g'},
];
const textureCards = [
  {title:'식어도 딱딱해지지 않습니다', copy:'하이아미는 아밀로스 함량이 18.2%입니다. 마른 상태로는 바삭하고, 뜨거운 물을 부으면 알갱이가 하나씩 풀어집니다. 덩어리째 붇지 않고 밥알처럼 흩어집니다.'},
  {title:'부드럽게도, 바삭하게도', copy:'더 부드럽게 드시려면 4분, 바삭한 식감을 좋아하시면 2분 불려 드세요. 치아가 약하시면 좀 더 불려 드시길 권합니다.'},
];
const enjoyCards = [
  {title:'든든한 한 그릇 식사', copy:'뜨거운 물에 3분이면 한 그릇이 됩니다. 물을 넉넉히 잡으면 국물이 넉넉해집니다.', image:'use-breakfast.jpg', alt:'식탁 위 누룽지 한 그릇과 숟가락'},
  {title:'라면이나 국물요리에', copy:'라면 끓일 때 마지막 1분에 한 줌. 백숙·삼계탕 국물에 넣으면 구수함이 올라옵니다.', image:'use-soup.jpg', alt:'라면 냄비에 누룽지를 넣은 모습'},
  {title:'캠핑·낚시·여행에', copy:'버너 없이 뜨거운 물만 있으면 됩니다. 보온병 물 한 잔이면 따뜻한 한 그릇이 됩니다.', image:'use-camping.jpg', alt:'캠핑 테이블 위 누룽지 그릇과 주전자'},
  {title:'가방 속 한 끼', copy:'한 봉 40g, 두께도 얇습니다. 사무실이나 가방에 두 봉 넣어 두세요.', image:'portable-flatlay.jpg', alt:'가방과 소지품 옆에 놓인 바른쌀 즉석 누룽지 단상자와 개별 포장'},
];
const giftCards = [
  {title:'원재료는 유기농쌀뿐', copy:'성분 걱정 없이 보내실 수 있습니다.'},
  {title:'한 봉씩 개별 포장', copy:'드실 만큼 하나씩 꺼내 드시면 됩니다.'},
  {title:'실온 12개월 보관', copy:'냉장고 자리를 차지하지 않습니다. 천천히 드셔도 됩니다.'},
];
const productInfoRows = [
  {item:'제품명', value:'바른쌀 즉석 누룽지'},
  {item:'식품유형', value:'즉석조리식품'},
  {item:'내용량', value:'200g (40g × 5봉지)'},
  {item:'품목보고번호', value:'19940512019133'},
  {item:'원재료명', value:'유기농쌀(국산) 100%'},
  {item:'제조원', value:'(주)대한식품 / 전남 나주시 동수농공단지길 62-18'},
  {item:'포장재질', value:'폴리에틸렌(내면)'},
  {item:'소비기한', value:'별도표시일까지 (제조일로부터 12개월)'},
  {item:'보관방법', value:'직사광선을 피해 서늘하고 건조한 곳에 실온 보관'},
  {item:'소비자상담실', value:`(주)현농푸드랩 <a href="tel:${consumerLine.replace(/-/g,'')}">${consumerLine}</a>`, plain:`(주)현농푸드랩 ${consumerLine}`},
];
const certRows = [
  {item:'HACCP', value:'식품의약품안전처'},
  {item:'유기가공식품', value:'제15800003호 — 농림축산식품부'},
  {item:'글루텐프리', value:'밀가루 0%, 쌀 100%'},
];
// P10 자주 묻는 질문 — 화면 문구와 FAQPage JSON-LD가 같은 배열을 쓴다
const faqGroups = [
  {group:'조리', items:[
    {q:'뜨거운 물은 얼마나 부어야 하나요?', a:'160ml입니다. 붓고 3분 기다리시면 됩니다. 바삭하게 드시려면 2분, 죽처럼 드시려면 4분으로 조절하세요.'},
    {q:'전자레인지로도 되나요?', a:'됩니다. 물 160ml를 붓고 전자레인지에 3분 돌려 드시면 됩니다.'},
  ]},
  {group:'원료', items:[
    {q:'국산 쌀인가요? 수입쌀이 섞인 건 아닌가요?', a:'유기농쌀(국산) 100%입니다. 국내에서 유기농으로 재배한 하이아미와 천지향5세 두 품종만 썼고, 배합비(70:30)까지 공개합니다. 품목보고번호 19940512019133으로 직접 조회하실 수 있습니다.'},
    {q:'유기농 원료와 유기가공식품 인증은 뭐가 다른가요?', a:'다릅니다. 원료만 유기농이면 원료가 유기농이라는 표시까지만 할 수 있습니다. 가공 공정과 제조 시설까지 심사를 통과해야 유기가공식품 인증이 나옵니다. 이 제품은 유기가공식품 인증 제15800003호를 받았습니다.'},
    {q:'글루텐이나 밀가루가 들어 있나요?', a:'들어 있지 않습니다. 원재료는 유기농쌀(국산) 100%이고 밀은 쓰지 않습니다. 지은 밥을 그대로 눌러 구운 제품입니다.'},
  ]},
  {group:'보관', items:[
    {q:'소비기한과 보관은 어떻게 되나요?', a:'제조일로부터 12개월이며 겉면에 표시되어 있습니다. 직사광선을 피해 서늘하고 건조한 곳에 실온 보관하세요. 뜯은 봉지는 밀봉해 두시면 바삭함이 오래갑니다.'},
  ]},
  {group:'구매', items:[
    {q:'어디서 구매할 수 있나요?', a:'네이버 스마트스토어에서 구매하실 수 있습니다. 쿠팡과 카카오톡딜에서도 판매 중입니다.',
     html:`<p>네이버 스마트스토어에서 구매하실 수 있습니다. 쿠팡과 카카오톡딜에서도 판매 중입니다.</p><div class="faq-actions">${storeCta('스마트스토어에서 구매')}${external(coupang,'쿠팡','text-link')}${external(kakao,'카카오톡딜','text-link')}</div>`},
    {q:'배송 중에 부서지지 않나요?', a:'누룽지는 물에 잘 풀리도록 적당한 크기로 파쇄한 제품이라 잔가루가 조금 생깁니다. 이 가루는 국물에 풀리며 구수한 맛을 더합니다. 한 봉씩 개별 포장한 뒤 단상자에 담아 보내드립니다.'},
  ]},
  {group:'건강', items:[
    // 문구 고정. "됩니다/안 됩니다" 표현을 추가하지 않는다.
    {q:'혈당 관리 중인데 먹어도 되나요?', a:'이 제품은 유기농 백미로 만든 누룽지로, 일반 밥과 비슷한 탄수화물 식품입니다. 1봉 40g 기준 152kcal, 탄수화물 34g, 당류 0g입니다. 건강 상태에 따른 섭취 여부는 전문가와 상담하시기 바랍니다.'},
  ]},
  {group:'회사', items:[
    {q:'현농푸드랩은 어떤 회사인가요?', a:'친환경 농자재 기업 (주)현농과 농업 경영컨설팅 기업 (주)현농경영연구소가 세운 식품 전문 회사입니다. 바른쌀 즉석 누룽지가 첫 제품입니다.',
     html:`<p>친환경 농자재 기업 (주)현농과 농업 경영컨설팅 기업 (주)현농경영연구소가 세운 식품 전문 회사입니다. 바른쌀 즉석 누룽지가 첫 제품입니다.</p><a class="text-link" href="/about/">현농푸드랩 소개 <span aria-hidden="true">→</span></a>`},
  ]},
];
const textCard = card => `<article class="text-card"><h3>${e(card.title)}</h3><p>${e(card.copy)}</p></article>`;
const dataTable = (caption, head, rows) => `<div class="data-table"><table><caption class="sr-only">${e(caption)}</caption><thead><tr>${head.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><th scope="row">${e(r[0])}</th>${r.slice(1).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

const productMeta = {
  title:'바른쌀 즉석 누룽지 | 국산 유기농쌀 100%, 유기가공식품 인증',
  description:'하이아미 70%, 천지향5세 30% 국산 유기농쌀로 만든 즉석 누룽지. 뜨거운 물 160ml, 3분이면 완성됩니다.',
};
const productLd = [
  {'@context':'https://schema.org','@type':'Product',name:'바른쌀 즉석 누룽지',description:productMeta.description,
   category:'즉석조리식품',brand:{'@type':'Brand',name:'바른쌀'},manufacturer:{'@type':'Organization',name:'주식회사 현농푸드랩'},
   nutrition:{'@type':'NutritionInformation',servingSize:'40g',calories:'152 kcal',sodiumContent:'3.44 mg',carbohydrateContent:'34 g',sugarContent:'0 g',fatContent:'0.5 g',transFatContent:'0 g',saturatedFatContent:'0.2 g',cholesterolContent:'0 mg',proteinContent:'3 g'}},
  {'@context':'https://schema.org','@type':'HowTo',name:'뜨거운 물 160ml, 3분',
   step:howToSteps.map((text,i)=>({'@type':'HowToStep',position:i+1,text}))},
  {'@context':'https://schema.org','@type':'FAQPage',
   mainEntity:faqGroups.flatMap(g=>g.items).map(f=>({'@type':'Question',name:f.q,acceptedAnswer:{'@type':'Answer',text:f.a}}))},
];

const productPage = () => layout('바른쌀 즉석 누룽지', `<main id="main">
<section class="feature"><div class="wrap feature-inner"><div class="feature-copy"><span class="hero-kicker">BARUNSSAL NURUNGJI</span><span class="category-label is-static">즉석조리식품</span><h1>뜨거운 물 붓고 3분,<br>국산 유기농쌀 100% 바른쌀 즉석 누룽지</h1><p>국산 유기농쌀 100% <span aria-hidden="true">·</span> HACCP <span aria-hidden="true">·</span> 실온 12개월 <span aria-hidden="true">·</span> 한 봉 40g 152kcal</p><div class="hero-actions">${storeCta('스마트스토어에서 구매')}<a class="text-link" href="#faq">자주 묻는 질문 보기 <span aria-hidden="true">→</span></a></div></div></div><figure class="feature-photo">${media('product-main.jpg','바른쌀 즉석 누룽지 단상자와 개별 포장 파우치','',true)}</figure></section>

<div class="section-jump"><div class="wrap"><nav class="category-tabs" aria-label="섹션 바로가기">${sectionNav.map(n=>`<a href="${n.href}">${e(n.label)}</a>`).join('')}</nav></div></div>

<section class="product-section"><div class="wrap"><header class="section-heading"><span class="eyebrow">WHY BARUNSSAL</span><h2>이렇게 만들었습니다</h2></header><div class="text-card-grid is-2col">${whyCards.map(textCard).join('')}</div></div></section>

<section class="product-section is-panel" id="howto"><div class="wrap"><header class="section-heading"><span class="eyebrow">HOW TO</span><h2>뜨거운 물 160ml, 3분</h2></header><ol class="howto-steps">${howToSteps.map((step,i)=>`<li><span>0${i+1}</span><p>${e(step)}</p></li>`).join('')}</ol><p class="section-note">전기포트로 끓인 물을 부어도 되고, 전자레인지에 3분 돌려도 됩니다. 물 160ml는 한 그릇 권장량이며 취향껏 조절하셔도 됩니다.</p><h3 class="sub-heading">불림 시간별 식감</h3><ul class="soak-grid">${soakLevels.map(level=>`<li><figure>${media(level.image, level.alt)}</figure><b>${e(level.time)}</b><span>${e(level.copy)}</span></li>`).join('')}</ul><p class="section-note">4분을 넘기면 흐물해집니다. 쌀의 원래 성질이니 취향에 맞춰 조정해 주세요.</p><p class="section-line">직접 끓이려면 불 앞에서 5분 넘게 저어야 하지만, 바른쌀 즉석 누룽지는 그럴 필요가 없습니다.</p></div></section>

<section class="product-section" id="ingredient"><div class="wrap"><header class="section-heading"><span class="eyebrow">INGREDIENT</span><h2>유기농 하이아미 70% + 천지향5세 30%</h2></header><p class="section-line">어떤 쌀로 만들었는지 품종과 배합비까지 공개합니다.</p>
<!-- P4 품종 이미지 rice-two-varieties.jpg 는 AI 임시본이라 비노출.
     낟알 모양이 실제와 달라, 실촬영본으로 교체하기 전까지 카드만 노출한다.
     교체 후 alt: 접시 두 개에 나눠 담은 하이아미와 천지향5세 원물 -->
<div class="text-card-grid is-2col">${riceCards.map(textCard).join('')}</div><p class="section-note">품종 정보 출처: 농촌진흥청 자료 ${todo('URL')}</p></div></section>

<section class="product-section is-panel" id="nutrition"><div class="wrap"><header class="section-heading"><span class="eyebrow">NUTRITION</span><h2>영양성분</h2></header>${dataTable('영양성분',['영양성분','1봉지(40g)당','총 내용량(200g)당'],nutritionRows.map(r=>[r.item,e(r.per),e(r.total)]))}<p class="section-note">괄호 안 숫자는 1일 영양성분 기준치에 대한 비율입니다. 2,000kcal 기준이므로 개인의 필요 열량에 따라 다를 수 있습니다.</p><p class="section-line">한 봉 152kcal, 밥 반 공기 정도 분량입니다.</p></div></section>

<section class="product-section"><div class="wrap"><header class="section-heading"><span class="eyebrow">TEXTURE</span><h2>드시는 분에 맞춰 시간만 바꾸면 됩니다</h2></header><div class="text-card-grid is-2col">${textureCards.map(textCard).join('')}</div></div></section>

<section class="topic-showcase" id="enjoy"><div class="wrap"><header class="section-heading"><span class="eyebrow">ENJOY</span><h2>이렇게도 드셔 보세요</h2></header><div class="topic-grid is-2col">${enjoyCards.map((card,i)=>`<article class="topic-card"><figure>${media(card.image,card.alt)}</figure><div class="topic-card-copy"><span>0${i+1}</span><h3>${e(card.title)}</h3><p>${e(card.copy)}</p></div></article>`).join('')}</div></div></section>

<section class="product-section is-panel" id="gift"><div class="wrap"><header class="section-heading"><span class="eyebrow">GIFT</span><h2>먹어보고 고르는 선물</h2></header><div class="gift-layout"><figure class="gift-photo">${media('gift-3box.jpg','바른쌀 즉석 누룽지 단상자 세 개를 선물 구성으로 놓은 모습')}</figure><div><p class="section-line">뜨거운 물 3분이면 숟가락으로 으깨질 만큼 부드러워집니다. 한 봉씩 꺼내 드시면 되고, 실온에서 12개월 보관됩니다.</p><div class="text-card-grid">${giftCards.map(textCard).join('')}</div></div></div></div></section>

<section class="product-section" id="product-info"><div class="wrap"><header class="section-heading"><span class="eyebrow">PRODUCT INFO</span><h2>제품 표시사항</h2></header><p class="section-line">인증번호까지 공개합니다.</p>${dataTable('제품 표시사항',['항목','내용'],productInfoRows.map(r=>[r.item,r.value]))}<h3 class="sub-heading">인증</h3><div class="cert-layout"><div class="trust-mark">${media('certification.png','HACCP 안전관리인증 마크와 유기가공식품 인증 마크 제15800003호')}</div>${dataTable('인증',['인증','내용'],certRows.map(r=>[r.item,e(r.value)]))}</div><p class="section-note">번호까지 적어 둔 것은 직접 조회해 보시라는 뜻입니다.</p></div></section>

<section class="product-section is-panel" id="faq"><div class="wrap"><header class="section-heading"><span class="eyebrow">FAQ</span><h2>자주 묻는 질문</h2></header><div class="faq-list">${faqGroups.map(group=>`<section class="faq-group"><h3>${e(group.group)}</h3>${group.items.map(item=>`<details><summary>${e(item.q)}</summary><div class="faq-answer">${item.html || `<p>${e(item.a)}</p>`}</div></details>`).join('')}</section>`).join('')}</div></div></section>

<section class="brand-feature"><div class="wrap brand-feature-inner"><figure>${media('hero-pour.jpg','흰 그릇에 담긴 바른쌀 즉석 누룽지에 뜨거운 물을 붓는 모습')}</figure><div class="brand-feature-copy"><span class="eyebrow">BARUNSSAL NURUNGJI</span><h2>지금 스마트스토어에서<br>만나보세요</h2><dl class="brand-facts"><div><dt>한 봉</dt><dd>40g</dd></div><div><dt>기본 구성</dt><dd>5봉</dd></div><div><dt>원료</dt><dd>국산 유기농쌀</dd></div></dl>${storeCta('스마트스토어에서 구매')}</div></div></section>
</main>`, 'product', {...productMeta, jsonLd:productLd});

// ---- 현농푸드랩 소개 페이지 (수정안 v1) ----
// A2 걸어온 길: 연도가 확정된 행만 노출한다. [확인 필요: 연도]
const milestones = [
  {year:'2007', copy:'(주)현농 설립 — 친환경 농자재 제조·판매'},
  {year:'2013', copy:'(주)현농경영연구소 설립 — 농업인 교육·경영컨설팅'},
  {year:'', copy:'(주)현농푸드랩 설립'},
  {year:'', copy:'첫 제품 바른쌀 즉석 누룽지 출시'},
];
// A4 숫자로 보는 현농 [자리표시: 근거 문서 확보 후 수치 최종 확인]
const aboutFigures = [
  {value:'2007년', copy:'(주)현농 설립'},
  {value:'2013년', copy:'(주)현농경영연구소 설립'},
  {value:'800회 이상', copy:'농업인 교육'},
  {value:'3,000회 이상', copy:'농업 경영컨설팅'},
];
const factList = (rows, cls='') => `<dl class="product-facts ${cls}">${rows.map(row=>`<div><dt>${e(row.term)}</dt><dd>${row.copy}</dd></div>`).join('')}</dl>`;

// A5 원료 품종 수상 — 원출처 확보 전까지 비노출 (주석으로만 보관)
const varietyAward = `<!-- A5 원료 품종 수상 (비노출)
     원료 품종 '천지향5세' — 2024 대한민국 우수품종상 대통령상 수상 품종
     노출 조건: 원출처(공식 발표·보도) 링크 확보
     노출 시 규칙: 수상 주체가 '품종'임을 명확히 적어 제품·회사가 받은 상으로 읽히지 않게 한다 -->`;

const aboutPage = () => layout('현농푸드랩 소개', `<main id="main">
<section class="feature"><div class="wrap feature-inner"><div class="feature-copy"><span class="hero-kicker">ABOUT HYUNNONG FOOD LAB</span><h1>20여 년 농업 전문기업이 만든 식품, 현농푸드랩</h1><p>친환경 농자재 기업 현농과 농업 경영컨설팅 기업 현농경영연구소가 함께 세운 식품 전문 회사입니다.</p><div class="hero-actions"><a class="button" href="/products/barunssal/">바른쌀 누룽지 보기 <span aria-hidden="true">→</span></a></div></div></div><figure class="feature-photo">${media('about-hyunnong.jpg','현농푸드랩 본사 사옥 전경','',true)}</figure></section>
<div class="read about">
<section><span class="eyebrow">OUR STORY</span><h2>걸어온 길</h2>${factList(milestones.filter(m=>m.year).map(m=>({term:m.year, copy:e(m.copy)})),'timeline')}</section>
<section class="prose"><h2>농사 곁에서 쌓은 경험을 식탁으로</h2><p>현농은 2007년부터 친환경 농자재를 만들며 친환경·유기농 재배 경험을 쌓아왔습니다.</p><p>현농경영연구소는 2013년부터 농업인 교육과 경영컨설팅으로 농산물 지식과 생산자 네트워크를 쌓아왔습니다.</p><p>그 경험으로 만든 첫 제품이, 유기농으로 재배한 우리쌀을 간편하게 드실 수 있도록 만든 바른쌀 즉석 누룽지입니다.</p><p>앞으로 우리 농산물로 만든 가공식품을 하나씩 늘려갈 계획입니다.</p><a class="text-link" href="/products/barunssal/">바른쌀 누룽지 보기 <span aria-hidden="true">→</span></a></section>
<section><h2>숫자로 보는 현농</h2>${factList(aboutFigures.map(f=>({term:f.value, copy:e(f.copy)})))}</section>
${varietyAward}
<section><h2>본사</h2><p class="about-address">현농푸드랩 본사 <span aria-hidden="true">·</span> 전남 장성 ${todo('상세주소')}</p></section>
</div>
<section class="brand-feature"><div class="wrap brand-feature-inner"><figure>${media('product-main.jpg','바른쌀 즉석 누룽지 단상자와 개별 포장 파우치')}</figure><div class="brand-feature-copy"><span class="eyebrow">FIRST PRODUCT</span><h2>현농푸드랩의 첫 제품,<br>바른쌀 즉석 누룽지</h2><p>국산 유기농쌀 100%. 뜨거운 물 붓고 3분이면 완성됩니다.</p><dl class="brand-facts"><div><dt>한 봉</dt><dd>40g</dd></div><div><dt>열량</dt><dd>152kcal</dd></div><div><dt>원료</dt><dd>국산 유기농쌀</dd></div></dl>${storeCta('스마트스토어에서 구매')}</div></div></section>
</main>`, 'about', {
  title:'현농푸드랩 소개 | 20년 농업 전문기업이 만든 식품 브랜드',
  description:'친환경 농자재 기업 현농과 농업 경영컨설팅 기업 현농경영연구소가 만든 식품 브랜드, 현농푸드랩을 소개합니다.',
  jsonLd:[organizationLd, {'@context':'https://schema.org','@type':'AboutPage',name:'현농푸드랩 소개',description:'친환경 농자재 기업 현농과 농업 경영컨설팅 기업 현농경영연구소가 만든 식품 브랜드, 현농푸드랩을 소개합니다.'}],
});
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
