/**
 * 檔案名稱：js/app.js
 * 職責：SPA 路由、動態渲染、LIFF 登入、影片播放器、Session 追蹤
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

// ⚠️ 請在這裡填入你申請的 LINE LIFF ID
const LIFF_ID = 'YOUR_LIFF_ID_HERE'; 

const PAGE_CONFIG = {
    '': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#home': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#about': { title: '關於協會', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#courses': { title: '精選課程與培訓', subtitle: '從技術到品牌經營，為您準備最完善的學習資源。', sheet: '課程介紹', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'card' },
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。', isForm: true },
    '#member-zone': { title: '會員專屬影音平台', subtitle: '觀看高階實戰課程與內部培訓影片', isMember: true }
};

let currentTrackingHash = window.location.hash || '#home';
let currentPageEntryTime = Date.now();

// === 1. 初始化系統 (包含計數器、IP與 LIFF) ===
async function initSystem() {
    // 獲取計數與 IP
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

    // === 初始化 LINE LIFF ===
    try {
        await liff.init({ liffId: LIFF_ID });
        // 如果使用者剛剛授權完跳回來，且已登入，我們自動處理登入邏輯
        if (liff.isLoggedIn() && !sessionStorage.getItem('cia_member')) {
            await handleLineLoginCallback();
        }
    } catch (err) {
        console.error('LIFF 初始化失敗。請確認 LIFF ID 是否正確。');
    }
}

// 處理 LIFF 登入後的回傳資料
async function handleLineLoginCallback() {
    showPreloader();
    try {
        const profile = await liff.getProfile();
        // 傳送給 GAS 進行比對或自動註冊
        const res = await fetch(GAS_URL, { 
            method: 'POST', 
            body: JSON.stringify({ 
                token: API_SECRET_TOKEN, 
                action: 'lineLogin', 
                lineUid: profile.userId,
                displayName: profile.displayName,
                pictureUrl: profile.pictureUrl
            }) 
        });
        const data = await res.json();
        if (data.status === 'success') {
            sessionStorage.setItem('cia_member', JSON.stringify(data.member));
            updateMemberUI();
            if (window.location.hash !== '#member-zone') {
                window.location.hash = '#member-zone'; // 強制導向影音專區
            } else {
                loadPage(); // 重整畫面
            }
        }
    } catch(e) {
        alert('LINE 登入連線失敗');
    } finally {
        hidePreloader();
    }
}

function updateMemberUI() {
    const memberBtn = document.getElementById('nav-member-btn');
    if (sessionStorage.getItem('cia_member') && memberBtn) {
        memberBtn.innerHTML = '🎬 進入影音平台';
    }
}

// === 2. 追蹤引擎 ===
function handlePageTransition() {
    const now = Date.now();
    const durationSeconds = Math.floor((now - currentPageEntryTime) / 1000);
    const ip = localStorage.getItem('visitor_ip') || '未知IP';
    const userAgent = navigator.userAgent;

    if (durationSeconds > 1) {
        let session = JSON.parse(localStorage.getItem('tracking_session') || 'null');
        const tenMins = 10 * 60 * 1000;
        if (!session || (now - session.lastActiveTime > tenMins) || session.views >= 10) {
            session = { id: 'SESS_' + now + '_' + Math.floor(Math.random() * 1000), entryTime: new Date(now - (durationSeconds * 1000)).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), views: 0 };
        }
        session.views += 1; session.lastActiveTime = now;
        const leaveTimeStr = new Date(now).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        localStorage.setItem('tracking_session', JSON.stringify(session));

        fetch(GAS_URL, { method: 'POST', keepalive: true, body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'trackSession', sessionId: session.id, entryTime: session.entryTime, leaveTime: leaveTimeStr, ip: ip, path: currentTrackingHash, duration: durationSeconds, userAgent: userAgent }) }).catch(e=>e);
    }
    currentTrackingHash = window.location.hash || '#home';
    currentPageEntryTime = now;
}

document.addEventListener('DOMContentLoaded', () => {
    initSystem(); setupMobileMenu(); setupMemberLogin();
    updateMemberUI();

    window.addEventListener('hashchange', () => { handlePageTransition(); loadPage(); });
    window.addEventListener('beforeunload', () => { handlePageTransition(); });
    loadPage();
});

function showPreloader() { const p = document.getElementById('preloader'); p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 500); }

// === 3. 頁面渲染邏輯 ===
async function loadPage() {
    showPreloader();
    const hash = window.location.hash || '#home';
    const config = PAGE_CONFIG[hash] || PAGE_CONFIG['#home'];

    document.getElementById('page-title').innerText = config.title;
    document.getElementById('page-subtitle').innerText = config.subtitle;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === hash) link.classList.add('active');
        else link.classList.remove('active');
    });

    const dataContainer = document.getElementById('data-container');
    const joinContainer = document.getElementById('join-container');
    const loginContainer = document.getElementById('login-container');

    dataContainer.style.display = 'none';
    if(joinContainer) joinContainer.style.display = 'none';
    loginContainer.style.display = 'none';
    dataContainer.innerHTML = '';

    if (config.isForm && joinContainer) { joinContainer.style.display = 'block'; hidePreloader(); return; }

    // 會員專區
    if (config.isMember) {
        const memberInfo = JSON.parse(sessionStorage.getItem('cia_member'));
        if (!memberInfo) {
            loginContainer.style.display = 'block';
            document.getElementById('page-subtitle').innerText = '請選擇登入方式以觀看專屬課程。';
            hidePreloader();
            return;
        }
        
        let avatarHtml = memberInfo.avatar ? `<img src="${memberInfo.avatar}" style="width:30px; height:30px; border-radius:50%; vertical-align:middle; margin-right:10px;">` : '';
        document.getElementById('page-subtitle').innerHTML = `${avatarHtml} 歡迎回來，${memberInfo.name} (${memberInfo.level}會員)。以下是您的專屬課程。`;
        dataContainer.style.display = 'grid';
        try {
            const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'getMemberCourses', memberLevel: memberInfo.level }) });
            const result = await res.json();
            if (result.status === 'success' && result.data.length > 1) renderVideoData(result.data, dataContainer);
            else dataContainer.innerHTML = '<p style="text-align:center; width:100%;">目前沒有可觀看的專屬影片。</p>';
        } catch(e) { dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">載入異常。</p>'; }
        hidePreloader();
        return;
    }

    // 一般資料展示
    dataContainer.style.display = 'grid'; 
    try {
        const response = await fetch(`${GAS_URL}?sheetName=${config.sheet}`);
        const result = await response.json();
        if (result.status === 'success' && result.data.length > 1) renderData(result.data, config.layout, dataContainer);
        else dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
    } catch (error) { dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常。</p>'; } 
    finally { hidePreloader(); }
}

// === 4. 登入邏輯 (LINE 與 傳統) ===
function setupMemberLogin() {
    // LINE 登入按鈕
    const lineBtn = document.getElementById('btn-line-login');
    if (lineBtn) {
        lineBtn.addEventListener('click', () => {
            if (!liff.isLoggedIn()) {
                // 會自動跳轉到 LINE 授權頁面
                liff.login();
            } else {
                handleLineLoginCallback();
            }
        });
    }

    // 傳統登入按鈕
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
                sessionStorage.setItem('cia_member', JSON.stringify(data.member));
                updateMemberUI();
                loadPage(); 
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

// === 影片與一般資料渲染邏輯 ===
function generateVideoHTML(url) {
    if (!url) return '';
    return `<div class="video-container"><iframe src="${url}" allowfullscreen></iframe></div>`;
}

function renderVideoData(rawData, container) {
    const headers = rawData[0];
    let html = '<div class="course-grid" style="width:100%;">';
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        const title = item['課程名稱'] || '專屬課程';
        const desc = item['課程簡介'] || '';
        const vidUrl = item['影片嵌入網址'] || '';
        const imgRaw = item['封面圖片網址'] || '';
        
        const mediaHtml = vidUrl ? generateVideoHTML(vidUrl) : generateImageHTML(imgRaw);
        
        html += `<div class="course-card">${mediaHtml}<div class="course-info"><h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3><p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p></div></div>`;
    }
    html += '</div>';
    container.innerHTML = html;
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
    if (rawUrls.length === 0) return `<img src="https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA" class="course-img" style="border-radius:12px;">`;
    const urls = rawUrls.map(url => optimizeImageUrl(url));
    if (urls.length === 1) return `<img src="${urls[0]}" class="course-img" style="border-radius:12px;">`;
    let html = `<div style="display:flex; overflow-x:auto; scroll-snap-type: x mandatory; border-radius:12px; margin-bottom:10px;">`;
    urls.forEach(url => { html += `<img src="${url}" style="flex: 0 0 100%; scroll-snap-align: start; width:100%; height:200px; object-fit:cover; background-color:#FAF7F2;">`; });
    html += `</div><div style="text-align:center; font-size:12px; color:var(--taupe); margin-top:-5px; margin-bottom:10px;">← 左右滑動查看多圖 →</div>`;
    return html;
}

function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto; width:100%;">' : '<div class="course-grid" style="width:100%;">';
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['產品名稱'] || item['名稱'] || item['標題'] || '';
        const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['產品簡介'] || item['內容'] || '';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || '';
        const linkRaw = item['報名連結'] || item['專屬付款網址'] || ''; 
        
        const imgHtml = generateImageHTML(imgRaw);
        let paymentBtnHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="display:block; text-align:center; margin-top:20px;">💳 專屬線上付款</a>` : '';
        
        if (layoutType === 'article') {
            html += `<div style="margin-bottom: 50px;">`;
            if (title) html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            html += imgHtml;
            if (desc) html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${desc.replace(/\n/g, '<br>')}</p>`;
            html += paymentBtnHtml; 
            html += `</div>`;
        } else {
            html += `<div class="course-card">${imgHtml}<div class="course-info">${title ? `<h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>` : ''}${desc ? `<p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>` : ''}${paymentBtnHtml}</div></div>`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}
