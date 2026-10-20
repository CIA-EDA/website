/**
 * 檔案名稱：js/app.js
 * 職責：SPA 路由、網址參數攔截、雙 LIFF 登入 (含官方 LINE 專屬 ID)、Session 追蹤、安全金庫跳轉
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

// 🔑 雙 LIFF 鑰匙設定
const LIFF_ID_MAIN = '2012121201-JKa4hPdF'; // 一般首頁用的 LIFF ID
const LIFF_ID_MEMBER = '2012121201-DRHgrrOJ'; // 官方 LINE 會員專區專用 LIFF ID

const PAGE_CONFIG = {
    '': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#home': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#about': { title: '關於協會', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#courses': { title: '精選課程與培訓', subtitle: '從技術到品牌經營，為您準備最完善的學習資源。', sheet: '課程介紹', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'card' },
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。為保障您的權益，請詳實填寫以下資料。', isForm: true },
    '#member-zone': { title: '會員登入與大廳', subtitle: '驗證會員身分以進入專屬學習平台', isMember: true }
};

// === 0. 網址參數轉換器 (解決 LINE LIFF 不支援 # 的問題) ===
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('zone') === 'member') {
    window.location.hash = '#member-zone'; 
    window.history.replaceState(null, '', window.location.pathname + '#member-zone');
}

let currentTrackingHash = window.location.hash || '#home';
let currentPageEntryTime = Date.now();

// === 1. 系統與動態 LIFF 初始化 ===
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

    // 動態判斷要使用哪一把 LIFF 鑰匙
    let activeLiffId = LIFF_ID_MAIN;
    if (window.location.hash === '#member-zone' || window.location.hash.includes('member-zone')) {
        activeLiffId = LIFF_ID_MEMBER;
    }

    try {
        await liff.init({ liffId: activeLiffId });
        
        if (liff.isInClient()) {
            document.body.classList.add('in-line-app'); 
            
            if (window.location.hash !== '#member-zone' && window.location.hash !== '#join') {
                window.location.hash = '#member-zone';
            }
            
            if (liff.isLoggedIn() && !localStorage.getItem('cia_member_credentials')) {
                await handleLineLoginCallback();
            } else if (!liff.isLoggedIn()) {
                liff.login();
            }
        } else {
            if (liff.isLoggedIn() && !localStorage.getItem('cia_member_credentials')) {
                await handleLineLoginCallback();
            }
        }
    } catch (err) { 
        console.error('LIFF 初始化失敗，請檢查 LIFF ID 設定', err); 
    }
}

async function handleLineLoginCallback() {
    showPreloader();
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
            updateMemberUI();
            if (window.location.hash !== '#member-zone') window.location.hash = '#member-zone'; else loadPage();
        } else { alert('系統驗證失敗：' + data.message); }
    } catch(e) { alert('LINE 登入連線失敗。'); } 
    finally { hidePreloader(); }
}

function updateMemberUI() {
    const memberBtn = document.getElementById('nav-member-btn');
    if (localStorage.getItem('cia_member_credentials') && memberBtn) {
        memberBtn.innerHTML = '🎬 進入影音平台';
    }
}

// === 2. 追蹤引擎 ===
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
    window.addEventListener('hashchange', () => { handlePageTransition(); loadPage(); });
    window.addEventListener('beforeunload', () => { handlePageTransition(); });
    loadPage();
});

function showPreloader() { const p = document.getElementById('preloader'); p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 500); }

// === 3. 頁面載入邏輯 ===
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

    // === 大門審核大廳區塊 ===
    if (config.isMember) {
        const credentials = localStorage.getItem('cia_member_credentials');
        const memberInfo = JSON.parse(localStorage.getItem('cia_member_info') || 'null');
        
        if (!credentials) {
            loginContainer.style.display = 'block';
            document.getElementById('page-subtitle').innerText = '請登入以驗證您的會員資格。';
            hidePreloader(); return;
        }
        
        let avatarHtml = memberInfo && memberInfo.avatar ? `<img src="${memberInfo.avatar}" style="width:50px; height:50px; border-radius:50%; vertical-align:middle; margin-right:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">` : '';
        let badgeHtml = memberInfo && memberInfo.level ? `<span style="background:var(--champagne); color:#fff; font-size:14px; padding:4px 12px; border-radius:20px; font-weight:bold;">${memberInfo.level} 會員</span>` : '';
        
        document.getElementById('page-subtitle').innerHTML = `身分驗證成功，點擊下方按鈕進入安全金庫。`;
        
        dataContainer.style.display = 'block';
        dataContainer.innerHTML = `
            <div style="background:#fff; border-radius:12px; padding:50px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.05); max-width:600px; margin:0 auto;">
                <div style="margin-bottom:30px;">
                    ${avatarHtml}
                    <h3 style="display:inline-block; margin:0; color:var(--ink-navy); font-size:24px; vertical-align:middle;">${memberInfo ? memberInfo.name : '尊榮會員'}，歡迎回來！</h3>
                </div>
                <div style="margin-bottom:40px;">${badgeHtml}</div>
                <a href="course_platform.html" class="candy-btn" style="font-size:20px; padding:15px 40px; border-radius:50px; background:linear-gradient(135deg, var(--ink-navy) 0%, #3a4a6b 100%); color:#fff !important;">🚀 進入專屬課程平台</a>
                <p style="font-size:13px; color:#888; margin-top:20px;">進入後系統將進行嚴格連線審核，並驗證您的到期日。</p>
                <button onclick="logoutMember()" style="margin-top:20px; background:none; border:none; color:red; text-decoration:underline; cursor:pointer;">登出帳號</button>
            </div>
        `;
        hidePreloader(); return;
    }

    dataContainer.style.display = 'grid'; 
    try {
        const response = await fetch(`${GAS_URL}?sheetName=${config.sheet}`);
        const result = await response.json();
        if (result.status === 'success' && result.data.length > 1) renderData(result.data, config.layout, dataContainer);
        else dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
    } catch (error) { dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常。</p>'; } 
    finally { hidePreloader(); }
}

function logoutMember() {
    localStorage.removeItem('cia_member_credentials');
    localStorage.removeItem('cia_member_info');
    if (liff.isLoggedIn()) { liff.logout(); }
    alert('已登出。');
    window.location.hash = '#home';
    loadPage();
}

function setupMemberLogin() {
    const lineBtn = document.getElementById('btn-line-login');
    if (lineBtn) {
        lineBtn.addEventListener('click', () => {
            if (!liff.isLoggedIn()) liff.login();
            else handleLineLoginCallback();
        });
    }

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

function setupContactModal() {
    const modal = document.getElementById('contact-modal');
    const openBtn = document.getElementById('open-contact-btn');
    const closeBtn = document.getElementById('close-contact-btn');
    const submitBtn = document.getElementById('submit-contact-btn');
    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

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
            alert('訊息已成功送出！'); modal.classList.remove('active');
            ['c-name', 'c-phone', 'c-line', 'c-subject', 'c-message'].forEach(id => document.getElementById(id).value = '');
        } catch (err) { alert('失敗請稍後重試'); } 
        finally { submitBtn.innerText = '確認送出'; submitBtn.disabled = false; }
    });
}

function setupJoinForm() {
    const submitBtn = document.getElementById('submit-join-btn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', async () => {
        const nameZh = document.getElementById('j-name-zh').value.trim();
        const nameEn = document.getElementById('j-name-en').value.trim();
        const birth = document.getElementById('j-birth').value;
        const idNum = document.getElementById('j-id').value.trim();
        const edu = document.getElementById('j-edu').value.trim();
        const company = document.getElementById('j-company').value.trim();
        const jobTitle = document.getElementById('j-jobtitle').value.trim();
        const phone = document.getElementById('j-phone').value.trim();
        const line = document.getElementById('j-line').value.trim();
        const email = document.getElementById('j-email').value.trim();
        const address = document.getElementById('j-address').value.trim();
        const remarks = document.getElementById('j-remarks').value.trim();

        const fields = Array.from(document.querySelectorAll('input[name="j-field"]:checked')).map(cb => cb.value).join(',');
        const expects = Array.from(document.querySelectorAll('input[name="j-expect"]:checked')).map(cb => cb.value).join(',');
        const membershipNode = document.querySelector('input[name="j-membership"]:checked');
        const newsletterNode = document.querySelector('input[name="j-newsletter"]:checked');

        if (!nameZh || !birth || !idNum || !edu || !fields || !company || !phone || !address || !membershipNode || !expects || !newsletterNode) {
            alert('請務必填寫所有標示星號 (*) 的必填欄位！'); return;
        }
        submitBtn.innerText = '資料傳送中...'; submitBtn.disabled = true;

        try {
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            const rowData = [timestamp, nameZh, nameEn, birth, idNum, edu, fields, company, jobTitle, phone, line, email, address, membershipNode.value, '', expects, newsletterNode.value, remarks];
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '入會申請', newRowData: rowData, action: 'submitJoin' }) });
            alert('申請成功！將引導至線上付款頁面。'); window.location.href = PAYUNI_URL;
        } catch (err) { alert('傳送失敗'); }
        finally { submitBtn.innerText = '確認送出並前往付款'; submitBtn.disabled = false; }
    });
}
