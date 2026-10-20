/**
 * 檔案名稱：js/app.js
 * 職責：SPA 路由、動態渲染、影片播放器、Session 追蹤、登入驗證
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

const PAGE_CONFIG = {
    '': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#home': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#about': { title: '關於協會', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#courses': { title: '精選課程與培訓', subtitle: '從技術到品牌經營，為您準備最完善的學習資源。', sheet: '課程介紹', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'card' },
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。為保障您的權益，請詳實填寫以下資料。', isForm: true },
    '#member-zone': { title: '會員專屬影音平台', subtitle: '觀看高階實戰課程與內部培訓影片', isMember: true }
};

let currentTrackingHash = window.location.hash || '#home';
let currentPageEntryTime = Date.now();

async function initTracker() {
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
}

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
    initTracker(); setupMobileMenu(); setupContactModal(); setupJoinForm(); setupMemberLogin();
    
    // 檢查登入狀態更新按鈕
    const memberBtn = document.getElementById('nav-member-btn');
    if (sessionStorage.getItem('cia_member') && memberBtn) {
        memberBtn.innerHTML = '🎬 進入影音平台';
    }

    window.addEventListener('hashchange', () => { handlePageTransition(); loadPage(); });
    window.addEventListener('beforeunload', () => { handlePageTransition(); });
    loadPage();
});

function showPreloader() { const p = document.getElementById('preloader'); p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 500); }

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
    joinContainer.style.display = 'none';
    loginContainer.style.display = 'none';
    dataContainer.innerHTML = '';

    if (config.isForm) { joinContainer.style.display = 'block'; hidePreloader(); return; }

    // === 會員影音專區處理 ===
    if (config.isMember) {
        const memberInfo = JSON.parse(sessionStorage.getItem('cia_member'));
        if (!memberInfo) {
            // 未登入，顯示登入表單
            loginContainer.style.display = 'block';
            document.getElementById('page-subtitle').innerText = '請輸入您的帳號密碼以觀看專屬課程。';
            hidePreloader();
            return;
        }
        
        // 已登入，抓取專屬影片
        document.getElementById('page-subtitle').innerText = `歡迎回來，${memberInfo.name} (${memberInfo.level}會員)。以下是您的專屬課程。`;
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

    dataContainer.style.display = 'grid'; 
    try {
        const response = await fetch(`${GAS_URL}?sheetName=${config.sheet}`);
        const result = await response.json();
        if (result.status === 'success' && result.data.length > 1) renderData(result.data, config.layout, dataContainer);
        else dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
    } catch (error) { dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常。</p>'; } 
    finally { hidePreloader(); }
}

// 處理會員登入
function setupMemberLogin() {
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
                document.getElementById('nav-member-btn').innerHTML = '🎬 進入影音平台';
                loadPage(); // 重新載入，就會進入影音列表
            } else { alert(data.message); }
        } catch(e) { alert('登入失敗，請稍後再試。'); }
        finally { btn.innerText = '登入平台'; btn.disabled = false; document.getElementById('m-password').value=''; }
    });
}

// === 動態產生影片播放器 (安全嵌入) ===
function generateVideoHTML(url) {
    if (!url) return '';
    // 將 YouTube 或 Drive 網址轉換為安全的 iframe，防護不支援直接下載
    return `<div class="video-container">
                <iframe src="${url}" allowfullscreen></iframe>
            </div>`;
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
        
        // 如果沒有輸入影片網址，就顯示封面圖
        const mediaHtml = vidUrl ? generateVideoHTML(vidUrl) : generateImageHTML(imgRaw);
        
        html += `
            <div class="course-card">
                ${mediaHtml}
                <div class="course-info">
                    <h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>
                    <p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>
                </div>
            </div>`;
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

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
        mainNav.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => mainNav.classList.remove('show')); });
    }
}
