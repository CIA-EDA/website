/**
 * 檔案名稱：js/app.js
 * 職責：快取引擎、LINE 登入路由、會員發文系統(5MB限制)、全新智能排版引擎
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

const LIFF_ID_MAIN = '2012121201-JKa4hPdF'; 
const LIFF_ID_MEMBER = '2012121201-DRHgrrOJ'; 

const AUTH_EXPIRY_MS = 3 * 60 * 60 * 1000; 
const CACHE_EXPIRY_MS = 5 * 60 * 1000; 

// === 新增路由設定 ===
const PAGE_CONFIG = {
    '': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#home': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#about': { title: '關於協會', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#courses': { title: '精選課程與培訓', subtitle: '從技術到品牌經營，為您準備最完善的學習資源。', sheet: '課程介紹', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'card' },
    '#jobs': { title: '徵才專區', subtitle: '網羅最新美業職缺與招募資訊，助您找到最適合的舞台。', sheet: '徵才專區', layout: 'card' },
    '#exchange': { title: '美業資訊交流', subtitle: '會員專屬交流天地，分享最新資訊與技術探討。', sheet: '美業資訊交流', layout: 'card' },
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。為保障您的權益，請詳實填寫以下資料。', isJoinIntent: true },
    '#member-zone': { title: '會員登入與大廳', subtitle: '驗證會員身分以進入專屬學習平台', isMember: true }
};

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('zone') === 'member') {
    document.body.classList.add('is-exclusive-zone');
    window.location.hash = '#member-zone'; 
    window.history.replaceState(null, '', window.location.pathname + '#member-zone');
}

let currentTrackingHash = window.location.hash || '#home';
let currentPageEntryTime = Date.now();
let currentViewDataCache = [];

function isAuthValid() {
    const authTime = localStorage.getItem('cia_auth_time');
    if (authTime && (Date.now() - parseInt(authTime) > AUTH_EXPIRY_MS)) {
        localStorage.removeItem('cia_member_credentials');
        localStorage.removeItem('cia_member_info');
        localStorage.removeItem('cia_auth_time');
        alert('為保障您的帳號安全，登入憑證已逾時 (超過3小時)，請重新登入。');
        return false;
    }
    return true;
}

async function fetchWithCache(sheetName) {
    const cacheKey = 'cia_cache_' + sheetName;
    const timeKey = 'cia_cache_time_' + sheetName;
    const cachedData = sessionStorage.getItem(cacheKey);
    const cacheTime = sessionStorage.getItem(timeKey);
    
    if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime) < CACHE_EXPIRY_MS)) {
        return JSON.parse(cachedData);
    }
    
    const res = await fetch(`${GAS_URL}?sheetName=${sheetName}`);
    const data = await res.json();
    if (data.status === 'success') {
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
        sessionStorage.setItem(timeKey, Date.now().toString());
    }
    return data;
}

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

async function initSystem() {
    try {
        const countRes = await fetch(`${GAS_URL}?action=getVisitorCount`);
        const countData = await countRes.json();
        if(countData.status === 'success') {
            const counterEl = document.getElementById('visitor-counter');
            if(counterEl) counterEl.innerText = countData.count.toLocaleString();
        }
    } catch(e) {}
    try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipRes.json();
        localStorage.setItem('visitor_ip', ipData.ip);
    } catch(e) {}

    let activeLiffId = LIFF_ID_MAIN;
    if (window.location.hash === '#member-zone' || window.location.hash.includes('member-zone')) activeLiffId = LIFF_ID_MEMBER;

    try {
        await liff.init({ liffId: activeLiffId });
        if (liff.isInClient() || document.body.classList.contains('is-exclusive-zone')) {
            document.body.classList.add('is-exclusive-zone'); 
            if (window.location.hash !== '#member-zone' && window.location.hash !== '#join') {
                window.location.hash = '#member-zone';
            }
            if (liff.isLoggedIn() && !localStorage.getItem('cia_member_credentials')) {
                await handleLineLoginCallback(true); 
            } else if (!liff.isLoggedIn()) {
                liff.login();
            }
        } else {
            if (liff.isLoggedIn() && !localStorage.getItem('cia_member_credentials')) {
                await handleLineLoginCallback(true); 
            }
        }
    } catch (err) { console.error('LIFF 初始化失敗', err); }
}

async function handleLineLoginCallback(isSilent = false) {
    if (!isSilent) showPreloader();
    try {
        const profile = await liff.getProfile();
        const res = await fetch(GAS_URL, { 
            method: 'POST', 
            body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'lineLogin', lineUid: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl }) 
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            localStorage.setItem('cia_member_credentials', JSON.stringify({ lineUid: profile.userId }));
            localStorage.setItem('cia_member_info', JSON.stringify(data.member));
            localStorage.setItem('cia_auth_time', Date.now().toString()); 
            
            updateMemberUI();
            if (window.location.hash === '#member-zone' || window.location.hash === '#join') {
                loadPage();
            } else if (!isSilent) {
                window.location.hash = '#member-zone';
            }
        } else {
            if (!isSilent) alert('登入異常：' + data.message);
        }
    } catch(e) { 
        if (!isSilent) alert('LINE 登入連線失敗。'); 
    } finally { 
        hidePreloader(); 
    }
}

function updateMemberUI() {
    if (!isAuthValid()) return; 
    const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
    const memberBtn = document.getElementById('nav-member-btn');
    if (memberInfo && memberBtn) {
        if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') memberBtn.innerHTML = '⏳ 會員審核中';
        else memberBtn.innerHTML = '🎬 進入專屬課程平台';
    }
}

function handlePageTransition() {
    const now = Date.now();
    const durationSeconds = Math.floor((now - currentPageEntryTime) / 1000);
    const ip = localStorage.getItem('visitor_ip') || '未知IP';
    if (durationSeconds > 1) {
        let session = JSON.parse(localStorage.getItem('tracking_session') || 'null');
        if (!session || (now - session.lastActiveTime > 600000) || session.views >= 10) {
            session = { id: 'SESS_' + now + '_' + Math.floor(Math.random() * 1000), entryTime: new Date(now - (durationSeconds * 1000)).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), views: 0 };
        }
        session.views += 1; session.lastActiveTime = now;
        localStorage.setItem('tracking_session', JSON.stringify(session));
        fetch(GAS_URL, { method: 'POST', keepalive: true, body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'trackSession', sessionId: session.id, entryTime: session.entryTime, leaveTime: new Date(now).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), ip: ip, path: currentTrackingHash, duration: durationSeconds, userAgent: navigator.userAgent }) }).catch(e=>e);
    }
    currentTrackingHash = window.location.hash || '#home';
    currentPageEntryTime = now;
}

document.addEventListener('DOMContentLoaded', () => {
    initSystem(); setupMobileMenu(); setupMemberLogin(); updateMemberUI();
    setupProfileCompletionForm(); 
    setupContactModal(); 
    setupPostModal(); // 初始化發文視窗事件
    window.addEventListener('hashchange', () => { handlePageTransition(); loadPage(); });
    window.addEventListener('beforeunload', () => { handlePageTransition(); });
    loadPage();
});

function showPreloader() { const p = document.getElementById('preloader'); p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 300); }

async function loadPage() {
    const hash = window.location.hash || '#home';
    const config = PAGE_CONFIG[hash] || PAGE_CONFIG['#home'];

    document.getElementById('page-title').innerText = config.title;
    document.getElementById('page-subtitle').innerText = config.subtitle;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === hash) link.classList.add('active');
        else link.classList.remove('active');
    });

    const dataContainer = document.getElementById('data-container');
    const loginContainer = document.getElementById('login-container');
    const profileContainer = document.getElementById('profile-completion-container');
    const joinPromptContainer = document.getElementById('join-prompt-container'); 
    const actionContainer = document.getElementById('action-container'); // 功能按鈕區

    dataContainer.style.display = 'none';
    loginContainer.style.display = 'none';
    if(profileContainer) profileContainer.style.display = 'none';
    if(joinPromptContainer) joinPromptContainer.style.display = 'none';
    actionContainer.style.display = 'none';
    actionContainer.innerHTML = '';
    dataContainer.innerHTML = '';

    // === 動態顯示發文按鈕 (美業資訊交流) ===
    if (hash === '#exchange') {
        actionContainer.style.display = 'block';
        actionContainer.innerHTML = `<button id="btn-open-post" class="candy-btn" style="background: var(--ink-navy); color: white !important;">📝 我要發文</button>`;
        document.getElementById('btn-open-post').addEventListener('click', () => {
            const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
            if (!memberInfo || !isAuthValid()) {
                alert('發文功能僅限會員使用，請先登入！');
                window.location.hash = '#member-zone';
                return;
            }
            if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') {
                alert(`您目前的狀態為【${memberInfo.memberStatus}】，無法發文。`);
                return;
            }
            document.getElementById('post-modal').classList.add('active');
        });
    }

    if (config.isJoinIntent || config.isMember) {
        if (!isAuthValid()) return; 
        const credentials = localStorage.getItem('cia_member_credentials');
        const memberInfo = JSON.parse(localStorage.getItem('cia_member_info') || 'null');
        
        if (!credentials) {
            if (config.isJoinIntent && joinPromptContainer) {
                joinPromptContainer.style.display = 'block';
            } else {
                loginContainer.style.display = 'block';
            }
            return;
        }

        if (memberInfo && memberInfo.needsProfileCompletion) {
            profileContainer.style.display = 'block';
            document.getElementById('p-name-zh').value = memberInfo.name || '';
            return;
        }
        
        if (config.isJoinIntent && !memberInfo.needsProfileCompletion) {
            document.getElementById('page-subtitle').innerHTML = `<span style="color:#e53e3e;">您已完成入會申請，目前狀態：${memberInfo.level}會員。</span><br>若權限遭停用或審核中，請靜候管理員通知或聯絡協會。`;
        } else {
            document.getElementById('page-subtitle').innerHTML = `身分驗證成功，點擊下方按鈕進入安全金庫。`;
        }

        let avatarHtml = memberInfo && memberInfo.avatar ? `<img src="${memberInfo.avatar}" style="width:50px; height:50px; border-radius:50%; vertical-align:middle; margin-right:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">` : '';
        let badgeHtml = memberInfo && memberInfo.level ? `<span style="background:var(--champagne); color:#fff; font-size:14px; padding:4px 12px; border-radius:20px; font-weight:bold;">${memberInfo.level} 會員</span>` : '';
        
        if (memberInfo && (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核')) {
            document.getElementById('page-subtitle').innerHTML = `<span style="color:#e53e3e;">您已完成資料綁定，目前狀態：${memberInfo.memberStatus}。</span>`;
            dataContainer.style.display = 'block';
            dataContainer.innerHTML = `
                <div style="background:#fff; border-radius:12px; padding:50px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.05); max-width:600px; margin:0 auto;">
                    <div style="margin-bottom:30px;">
                        ${avatarHtml}
                        <h3 style="display:inline-block; margin:0; color:var(--ink-navy); font-size:24px; vertical-align:middle;">${memberInfo.name}，您好！</h3>
                    </div>
                    <div style="padding:20px; background:#fff3cd; color:#856404; border-radius:8px; margin-bottom:30px; text-align:left; font-size:15px; line-height:1.6;">
                        <strong>⏳ 您的會員資格正在審核中</strong><br>協會顧問將盡快為您確認資料。<br>在審核通過前，專屬課程平台將暫時無法進入，但您仍可自由瀏覽網站的其他公開資訊。
                    </div>
                    <button onclick="logoutMember()" style="display:block; margin:20px auto 0; background:none; border:none; color:red; text-decoration:underline; cursor:pointer;">登出帳號</button>
                </div>
            `;
            return;
        }

        dataContainer.style.display = 'block';
        dataContainer.innerHTML = `
            <div style="background:#fff; border-radius:12px; padding:50px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.05); max-width:600px; margin:0 auto;">
                <div style="margin-bottom:30px;">
                    ${avatarHtml}
                    <h3 style="display:inline-block; margin:0; color:var(--ink-navy); font-size:24px; vertical-align:middle;">${memberInfo ? memberInfo.name : '尊榮會員'}，歡迎回來！</h3>
                </div>
                <div style="margin-bottom:40px;">${badgeHtml}</div>
                <a href="course_platform.html" class="candy-btn" style="font-size:20px; padding:15px 40px; border-radius:50px; background:linear-gradient(135deg, var(--ink-navy) 0%, #3a4a6b 100%); color:#fff !important;">🚀 進入專屬課程平台</a>
                <button onclick="logoutMember()" style="display:block; margin:20px auto 0; background:none; border:none; color:red; text-decoration:underline; cursor:pointer;">登出帳號</button>
            </div>
        `;
        return;
    }

    showPreloader();
    dataContainer.style.display = 'grid'; 
    try {
        const result = await fetchWithCache(config.sheet);
        if (result.status === 'success' && result.data.length > 1) {
            // == 如果是交流版面，把最新的排在最前面 ==
            let finalData = result.data;
            if (config.sheet === '美業資訊交流') {
                const headers = finalData.shift();
                finalData = finalData.reverse();
                finalData.unshift(headers);
            }
            renderData(finalData, config.layout, dataContainer);
        } else {
            dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
        }
    } catch (error) { dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常。</p>'; } 
    finally { hidePreloader(); }
}

// === 新增：會員發文視窗與上傳邏輯 ===
function setupPostModal() {
    const postModal = document.getElementById('post-modal');
    const closePostBtn = document.getElementById('close-post-btn');
    const submitPostBtn = document.getElementById('submit-post-btn');
    
    if(closePostBtn) closePostBtn.addEventListener('click', () => postModal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === postModal) postModal.classList.remove('active'); });

    if (submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const fileInput = document.getElementById('post-image');

            if (!title || !content) { alert('請填寫標題與內容！'); return; }

            let base64Data = null;
            let mimeType = null;
            let fileName = null;

            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                // 核心防護：限制 5MB
                if (file.size > 5 * 1024 * 1024) {
                    alert('照片大小超過 5MB 上限，請壓縮後再上傳！');
                    return;
                }
                base64Data = await readFileAsBase64(file);
                mimeType = file.type;
                fileName = file.name;
            }

            submitPostBtn.innerText = '發佈中...'; submitPostBtn.disabled = true;
            
            try {
                const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
                
                let imgUrl = '';
                if (base64Data) {
                    submitPostBtn.innerText = '上傳圖片中...';
                    const resImg = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: '美業資訊交流', base64Data: base64Data, mimeType: mimeType, fileName: fileName }) });
                    const imgData = await resImg.json();
                    if (imgData.status === 'success') imgUrl = imgData.url;
                }

                submitPostBtn.innerText = '寫入資料庫...';
                await fetch(GAS_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({ 
                        token: API_SECRET_TOKEN, 
                        action: 'userPostExchange', 
                        lineUid: credentials.lineUid, 
                        postTitle: title, 
                        postContent: content, 
                        imgUrl: imgUrl 
                    }) 
                });
                
                alert('發佈成功！');
                postModal.classList.remove('active');
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                fileInput.value = '';
                
                // 清除快取並重新載入
                sessionStorage.removeItem('cia_cache_美業資訊交流');
                loadPage();

            } catch(e) { 
                alert('發佈失敗：' + e.message); 
            } finally { 
                submitPostBtn.innerText = '確認發佈'; submitPostBtn.disabled = false; 
            }
        });
    }
}

function setupProfileCompletionForm() {
    const submitBtn = document.getElementById('submit-profile-btn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', async () => {
        const profileData = {
            nameZh: document.getElementById('p-name-zh').value.trim(),
            nameEn: document.getElementById('p-name-en').value.trim(),
            gender: document.getElementById('p-gender').value,
            birth: document.getElementById('p-birth').value,
            idNum: document.getElementById('p-id').value.trim(),
            phone: document.getElementById('p-phone').value.trim(),
            line: document.getElementById('p-line').value.trim(),
            email: document.getElementById('p-email').value.trim(),
            address: document.getElementById('p-address').value.trim(),
            edu: document.getElementById('p-edu').value,
            fields: document.getElementById('p-fields').value.trim(),
            company: document.getElementById('p-company').value.trim(),
            jobTitle: document.getElementById('p-jobtitle').value.trim(),
            membership: document.getElementById('p-membership').value
        };

        if (!profileData.nameZh || !profileData.birth || !profileData.idNum || !profileData.phone || !profileData.email) {
            alert('請填寫所有標示星號 (*) 的必填欄位！'); return;
        }

        submitBtn.innerText = '送出審核中...'; submitBtn.disabled = true;
        try {
            const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
            await fetch(GAS_URL, { 
                method: 'POST', 
                body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'updateMemberProfile', lineUid: credentials.lineUid, profileData: profileData }) 
            });
            alert('入會申請送出成功！管理員審核通過後即可開通權限。\n即將引導至線上付款頁面。');
            
            let memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
            memberInfo.needsProfileCompletion = false;
            memberInfo.name = profileData.nameZh;
            memberInfo.memberStatus = '待審核';
            localStorage.setItem('cia_member_info', JSON.stringify(memberInfo));
            
            window.location.href = PAYUNI_URL;
        } catch(e) { alert('儲存失敗，請稍後再試。'); } 
        finally { submitBtn.innerText = '確認送出申請並前往繳費'; submitBtn.disabled = false; }
    });
}

function logoutMember() {
    localStorage.removeItem('cia_member_credentials');
    localStorage.removeItem('cia_member_info');
    localStorage.removeItem('cia_auth_time');
    sessionStorage.clear();
    
    if (liff.isLoggedIn()) { liff.logout(); }
    alert('已登出。');
    window.location.hash = '#home';
    loadPage();
}

function setupMemberLogin() {
    const lineBtns = document.querySelectorAll('.line-login-trigger');
    lineBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!liff.isLoggedIn()) liff.login();
            else handleLineLoginCallback();
        });
    });

    const btn = document.getElementById('submit-login-btn');
    if(!btn) return;
    btn.addEventListener('click', async () => {
        const acc = document.getElementById('m-account').value.trim();
        const pwd = document.getElementById('m-password').value.trim();
        if(!acc || !pwd) { alert('請輸入帳號密碼！'); return; }
        
        btn.innerText = '驗證中...'; btn.disabled = true;
        try {
            const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'memberLogin', account: acc, password: pwd }) });
            const data = await res.json();
            if (data.status === 'success') {
                localStorage.setItem('cia_member_credentials', JSON.stringify({ account: acc, password: pwd }));
                localStorage.setItem('cia_member_info', JSON.stringify(data.member));
                updateMemberUI(); loadPage(); 
            } else { alert(data.message); }
        } catch(e) { alert('登入失敗，請稍後再試。'); }
        finally { btn.innerText = '一般登入'; btn.disabled = false; document.getElementById('m-password').value=''; }
    });
}

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
        mainNav.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => mainNav.classList.remove('show')); });
    }
}

function optimizeImageUrl(url) {
    if (url.includes('drive.google.com') && !url.includes('thumbnail')) {
        const idMatch = url.match(/id=([^&]+)/);
        if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }
    return url;
}

function generateImageHTML(imgString) {
    const rawUrls = imgString.split(',').map(u => u.trim()).filter(u => u);
    
    if (rawUrls.length === 0) {
        return `<div class="img-wrapper"><img src="https://via.placeholder.com/800x600/E8D3CB/1F2D4A?text=CIA-EDA" alt="Placeholder"></div>`;
    }
    
    const urls = rawUrls.map(url => optimizeImageUrl(url));
    
    if (urls.length === 1) {
        return `<div class="img-wrapper"><img src="${urls[0]}" alt="Course Image"></div>`;
    }
    
    let html = `<div class="img-wrapper"><div class="carousel-container">`;
    urls.forEach(url => { html += `<img src="${url}" alt="Course Image">`; });
    html += `</div></div><div class="carousel-hint">← 左右滑動查看多圖 →</div>`;
    return html;
}

// === 核心優化：智能排版渲染引擎 (支援徵才與發文格式) ===
function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    currentViewDataCache = []; 
    
    let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto; width:100%;">' : '<div class="course-grid" style="width:100%;">';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        
        currentViewDataCache.push(item);
        const dataIndex = currentViewDataCache.length - 1;

        const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
        let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || '';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || '';
        const linkRaw = item['報名連結'] || item['專屬付款網址'] || ''; 
        
        // 智能排版：徵才專區
        if (item['徵才機構']) {
            desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
        } 
        // 智能排版：美業資訊交流
        else if (item['發文者姓名']) {
            desc = `👤 發文者：${item['發文者姓名']}\n🕒 時間：${item['發文時間']}\n\n${item['交流內容']}`;
        }
        // 智能排版：師資專區
        else if (item['專長項目']) {
            desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
        }
        
        const imgHtml = generateImageHTML(imgRaw);
        let paymentBtnHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="display:block; text-align:center; margin-top:20px;" onclick="event.stopPropagation();">💳 專屬線上付款</a>` : '';
        
        let shortDesc = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;

        if (layoutType === 'article') {
            html += `<div style="margin-bottom: 50px;">`;
            if (title) html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            html += imgHtml;
            html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${desc.replace(/\n/g, '<br>')}</p>`;
            html += paymentBtnHtml; 
            html += `</div>`;
        } else {
            html += `
                <div class="course-card" onclick="openDetailModal(${dataIndex})" style="cursor: pointer;" title="點擊查看詳細資料">
                    ${imgHtml}
                    <div class="course-info">
                        ${title ? `<h3 class="course-title">${title}</h3>` : ''}
                        ${shortDesc ? `<p class="course-desc">${shortDesc.replace(/\n/g, '<br>')}</p>` : ''}
                        ${paymentBtnHtml}
                    </div>
                </div>
            `;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}

window.openDetailModal = function(index) {
    const item = currentViewDataCache[index];
    if (!item) return;

    const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
    let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || '';
    const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || '';
    const linkRaw = item['報名連結'] || item['專屬付款網址'] || ''; 

    if (item['徵才機構']) {
        desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
    } else if (item['發文者姓名']) {
        desc = `👤 發文者：${item['發文者姓名']}\n🕒 時間：${item['發文時間']}\n\n${item['交流內容']}`;
    } else if (item['專長項目']) {
        desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
    }

    let imagesHtml = '';
    const rawUrls = imgRaw.split(',').map(u => u.trim()).filter(u => u);
    if (rawUrls.length > 0) {
        rawUrls.forEach(url => {
            const optimized = optimizeImageUrl(url);
            imagesHtml += `<img src="${optimized}" style="width: 100%; display: block; border-bottom: 1px solid #eee;">`;
        });
    }

    let actionHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="font-size: 18px; padding: 12px 30px;">💳 前往報名/付款</a>` : '';

    document.getElementById('detail-modal-images').innerHTML = imagesHtml;
    document.getElementById('detail-modal-title').innerText = title;
    document.getElementById('detail-modal-desc').innerHTML = desc.replace(/\n/g, '<br>');
    document.getElementById('detail-modal-action').innerHTML = actionHtml;

    document.getElementById('detail-modal').classList.add('active');
};

function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const openContactBtn = document.getElementById('open-contact-btn');
    const closeContactBtn = document.getElementById('close-contact-btn');
    if(openContactBtn) openContactBtn.addEventListener('click', () => contactModal.classList.add('active'));
    if(closeContactBtn) closeContactBtn.addEventListener('click', () => contactModal.classList.remove('active'));
    
    const detailModal = document.getElementById('detail-modal');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    if(closeDetailBtn) closeDetailBtn.addEventListener('click', () => detailModal.classList.remove('active'));

    window.addEventListener('click', (e) => { 
        if (e.target === contactModal) contactModal.classList.remove('active'); 
        if (e.target === detailModal) detailModal.classList.remove('active');
    });

    const submitBtn = document.getElementById('submit-contact-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name = document.getElementById('c-name').value.trim();
            const phone = document.getElementById('c-phone').value.trim();
            const line = document.getElementById('c-line').value.trim();
            const subject = document.getElementById('c-subject').value.trim();
            const msg = document.getElementById('c-message').value.trim();
            if (!name || !phone || !subject || !msg) { alert('請填寫所有必填欄位！'); return; }
            submitBtn.innerText = '傳送中...'; submitBtn.disabled = true;
            try {
                const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
                await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '聯絡我們', newRowData: [timestamp, name, phone, line, subject, msg], action: 'submitContact' }) });
                alert('訊息已成功送出！'); contactModal.classList.remove('active');
                ['c-name', 'c-phone', 'c-line', 'c-subject', 'c-message'].forEach(id => document.getElementById(id).value = '');
            } catch (err) { alert('失敗請稍後重試'); } 
            finally { submitBtn.innerText = '確認送出'; submitBtn.disabled = false; }
        });
    }
}
