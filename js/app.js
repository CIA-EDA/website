/**
 * 檔案名稱：js/app.js
 * 職責：快取引擎、前台路由、全模組智能排版引擎、半公開線上課程權限驗證
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

// 🔑 雙 LIFF 鑰匙設定
const LIFF_ID_MAIN = '2012121201-JKa4hPdF'; 
const LIFF_ID_MEMBER = '2012121201-DRHgrrOJ'; // ⚠️ 請確保這是您的官方 LINE 專屬 ID

const AUTH_EXPIRY_MS = 3 * 60 * 60 * 1000; 
const CACHE_EXPIRY_MS = 5 * 60 * 1000; 

// === 更新路由設定：確保實體課程介紹存在，並更名線上課程平台 ===
const PAGE_CONFIG = {
    '': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#home': { title: '重新定義美學與專業', subtitle: '打造全方位美業人才的孵化平台', sheet: '課程介紹', layout: 'card' },
    '#courses': { title: '課程介紹', subtitle: '從技術到品牌經營，為您準備最完善的實體學習資源。', sheet: '課程介紹', layout: 'card' },
    '#about': { title: '協會介紹', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#consultants': { title: '專業顧問', subtitle: '產業頂尖顧問群，提供全方位美業指導。', sheet: '專業顧問', layout: 'card' },
    '#stores': { title: '認證店家', subtitle: 'CIA-EDA 嚴選認證，提供高品質的美業服務體驗。', sheet: '認證店家', layout: 'card' },
    '#jobs': { title: '徵才專區', subtitle: '網羅最新美業職缺與招募資訊，助您找到最適合的舞台。', sheet: '徵才專區', layout: 'card' },
    '#exchange': { title: '美業資訊交流', subtitle: '會員專屬交流天地，分享最新資訊與技術探討。', sheet: '美業資訊交流', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'card' },
    '#course-platform': { title: '線上課程平台', subtitle: '高品質線上預錄課程與培訓資源。(觀看影片需登入會員)', sheet: '會員專屬影片', layout: 'card' }
};

let currentTrackingHash = window.location.hash || '#home';
let currentPageEntryTime = Date.now();
let currentViewDataCache = [];
window.currentCommentsCache = [];

function getCleanTime() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}

function isAuthValid() {
    const authTime = localStorage.getItem('cia_auth_time');
    if (authTime && (Date.now() - parseInt(authTime) > AUTH_EXPIRY_MS)) {
        localStorage.removeItem('cia_member_credentials');
        localStorage.removeItem('cia_member_info');
        localStorage.removeItem('cia_auth_time');
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
        await liff.init({ liffId: LIFF_ID_MAIN });
        if (liff.isInClient()) {
            window.location.href = 'member_hub.html';
        }
    } catch (err) {}
}

function updateMemberUI() {
    if (!isAuthValid()) return; 
    const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
    const memberBtn = document.getElementById('nav-member-btn');
    if (memberInfo && memberBtn) {
        if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') memberBtn.innerHTML = '⏳ 會員審核中';
        else memberBtn.innerHTML = '👤 會員專區';
    }
}

function handlePageTransition() {
    const now = Date.now();
    const durationSeconds = Math.floor((now - currentPageEntryTime) / 1000);
    const ip = localStorage.getItem('visitor_ip') || '未知IP';
    if (durationSeconds > 1) {
        let session = JSON.parse(localStorage.getItem('tracking_session') || 'null');
        if (!session || (now - session.lastActiveTime > 600000) || session.views >= 10) {
            session = { id: 'SESS_' + now + '_' + Math.floor(Math.random() * 1000), entryTime: getCleanTime(), views: 0 };
        }
        session.views += 1; session.lastActiveTime = now;
        localStorage.setItem('tracking_session', JSON.stringify(session));
        fetch(GAS_URL, { method: 'POST', keepalive: true, body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'trackSession', sessionId: session.id, entryTime: session.entryTime, leaveTime: getCleanTime(), ip: ip, path: currentTrackingHash, duration: durationSeconds, userAgent: navigator.userAgent }) }).catch(e=>e);
    }
    currentTrackingHash = window.location.hash || '#home';
    currentPageEntryTime = now;
}

document.addEventListener('DOMContentLoaded', () => {
    initSystem(); setupMobileMenu(); updateMemberUI();
    setupContactModal(); setupPostModal(); 
    window.addEventListener('hashchange', () => { handlePageTransition(); loadPage(); });
    window.addEventListener('beforeunload', () => { handlePageTransition(); });
    loadPage();
});

function showPreloader() { const p = document.getElementById('preloader'); p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
function hidePreloader() { const p = document.getElementById('preloader'); p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 300); }

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
    const actionContainer = document.getElementById('action-container'); 

    actionContainer.style.display = 'none';
    actionContainer.innerHTML = '';
    dataContainer.innerHTML = '';

    if (hash === '#exchange') {
        actionContainer.style.display = 'block';
        actionContainer.innerHTML = `<button id="btn-open-post" class="candy-btn" style="background: var(--ink-navy); color: white !important;">📝 我要發文</button>`;
        document.getElementById('btn-open-post').addEventListener('click', () => {
            const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
            if (!memberInfo || !isAuthValid()) {
                alert('發文功能僅限會員使用，請先登入！');
                window.location.href = 'member_hub.html';
                return;
            }
            if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') {
                alert(`您目前的狀態為【${memberInfo.memberStatus}】，無法發文。`);
                return;
            }
            document.getElementById('post-modal').classList.add('active');
        });
    }

    dataContainer.style.display = 'grid'; 
    try {
        const result = await fetchWithCache(config.sheet);
        
        if (config.sheet === '美業資訊交流') {
            const commentsRes = await fetchWithCache('交流留言');
            if (commentsRes.status === 'success' && commentsRes.data.length > 1) {
                window.currentCommentsCache = commentsRes.data.slice(1);
            }
        }

        if (result.status === 'success' && result.data.length > 1) {
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
                    body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'userPostExchange', lineUid: credentials.lineUid, postTitle: title, postContent: content, imgUrl: imgUrl }) 
                });
                
                alert('發佈成功！');
                postModal.classList.remove('active');
                document.getElementById('post-title').value = '';
                document.getElementById('post-content').value = '';
                fileInput.value = '';
                
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

// 播放線上課程防護鎖
window.playCourseVideo = async function(event, courseTitle, reqLevel) {
    event.stopPropagation();
    if (!isAuthValid()) {
         alert('請先登入會員！');
         window.location.href = 'member_hub.html';
         return;
    }
    const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
    const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
    if (!credentials || !memberInfo) {
         alert('請先登入會員！');
         window.location.href = 'member_hub.html';
         return;
    }
    if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') {
        alert(`您的狀態為【${memberInfo.memberStatus}】，無法觀看課程。`);
        return;
    }
    
    const btn = event.target;
    const ogText = btn.innerText;
    btn.innerText = '驗證專屬權限中...';
    btn.disabled = true;

    try {
        const res = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'verifyAndGetCourses', credentials: credentials })
        });
        const data = await res.json();
        if (data.status === 'success') {
            const courses = data.data.slice(1);
            const course = courses.find(c => c[0] === courseTitle);
            if (course && course[1]) {
                document.getElementById('video-player-container').innerHTML = `<iframe src="${course[1]}" allowfullscreen></iframe>`;
                document.getElementById('video-modal').classList.add('active');
            } else {
                alert(`權限不足或找不到該課程影片。此課程需為【${reqLevel}】。`);
            }
        } else {
            alert(data.message || '驗證失敗');
        }
    } catch(e) {
        alert('連線失敗，請稍後再試。');
    } finally {
        btn.innerText = ogText;
        btn.disabled = false;
    }
}

window.submitComment = async function(event, index, postTitle, postTime, isModal = false) {
    if(event) event.stopPropagation(); 
    
    const inputId = isModal ? `modal-comment-input-${index}` : `comment-input-${index}`;
    const input = document.getElementById(inputId);
    const content = input.value.trim();
    if (!content) { alert('請輸入留言內容！'); return; }

    const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
    const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
    
    if (!credentials || !memberInfo) {
        alert('請先登入會員才能留言！');
        return;
    }
    if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') {
        alert(`您的狀態為【${memberInfo.memberStatus}】，無法留言。`);
        return;
    }

    const btn = event.target;
    const ogText = btn.innerText;
    btn.innerText = '傳送中...';
    btn.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                token: API_SECRET_TOKEN,
                action: 'submitComment',
                lineUid: credentials.lineUid,
                postTitle: postTitle,
                postTime: postTime,
                content: content
            })
        });
        alert('留言成功！');
        input.value = '';
        sessionStorage.removeItem('cia_cache_交流留言'); 
        document.getElementById('detail-modal').classList.remove('active');
        loadPage(); 
    } catch(e) {
        alert('留言失敗，請稍後再試。');
    } finally {
        btn.innerText = ogText;
        btn.disabled = false;
    }
};

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
        mainNav.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => { link.addEventListener('click', () => mainNav.classList.remove('show')); });
        
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    dropdown.classList.toggle('mobile-active');
                }
            });
        });
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

function buildCommentsHtml(postTitle, postTime, dataIndex, isModal = false) {
    const comments = (window.currentCommentsCache || []).filter(c => c[0] === postTitle && c[1] === postTime);
    let html = '<div class="comments-section" style="margin-top:20px; border-top:1px dashed #eee; padding-top:15px; text-align:left;">';
    
    if (comments.length > 0) {
        comments.forEach(c => {
            html += `
            <div style="font-size:14px; margin-bottom:10px; padding:10px; background:#f8f9fa; border-radius:8px; border-left:3px solid var(--champagne);">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong style="color:var(--ink-navy);">${c[2]}</strong>
                    <span style="color:#aaa; font-size:12px;">${c[3]}</span>
                </div>
                <div style="color:var(--text-dark); line-height:1.5;">${c[4].replace(/\n/g, '<br>')}</div>
            </div>`;
        });
    } else {
        html += `<div style="font-size:13px; color:#aaa; margin-bottom:10px; text-align:center;">目前尚無留言，來搶頭香吧！</div>`;
    }
    
    const inputId = isModal ? `modal-comment-input-${dataIndex}` : `comment-input-${dataIndex}`;
    html += `
        <div style="display:flex; gap:10px; margin-top:10px;" onclick="event.stopPropagation();">
            <input type="text" id="${inputId}" class="input-field" placeholder="輸入留言..." style="padding:10px; flex:1; font-size:14px;">
            <button class="candy-btn" onclick="submitComment(event, ${dataIndex}, '${postTitle}', '${postTime}', ${isModal})" style="padding:10px 20px; font-size:14px; border:none; cursor:pointer;">留言</button>
        </div>
    </div>`;
    return html;
}

function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    currentViewDataCache = []; 
    
    let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto; width:100%;">' : '<div class="course-grid" style="width:100%;">';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        
        currentViewDataCache.push(item);
        const dataIndex = currentViewDataCache.length - 1;

        const title = item['課程名稱'] || item['講師姓名'] || item['顧問姓名'] || item['店家名稱'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
        let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || '';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || '';
        const linkRaw = item['報名連結'] || item['專屬付款網址'] || item['連結'] || ''; 
        
        let extraHtml = ''; 

        if (item['徵才機構']) {
            desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
        } else if (item['發文者姓名']) {
            desc = `👤 發文者：${item['發文者姓名']}\n🕒 時間：${item['發文時間']}\n\n${item['交流內容']}`;
            extraHtml = buildCommentsHtml(item['主旨/標題']||'', item['發文時間']||'', dataIndex, false);
        } else if (item['專長項目']) {
            desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
        } else if (item['店家名稱']) {
            desc = `👤 負責人：${item['負責人']}\n📍 地址：${item['地址']}\n📞 電話：${item['聯絡電話']}\n\n${item['簡介']}`;
        }
        
        const imgHtml = generateImageHTML(imgRaw);
        
        let paymentBtnHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="display:block; text-align:center; margin-top:20px;" onclick="event.stopPropagation();">💳 了解更多 / 報名</a>` : '';
        
        // 核心更新：線上課程的播放按鈕文字
        if (item['最低權限要求(例如:一般會員)'] !== undefined) {
            const reqLevel = item['最低權限要求(例如:一般會員)'] || '會員';
            paymentBtnHtml = `<button class="candy-btn member-btn" style="display:block; width:100%; text-align:center; margin-top:20px;" onclick="playCourseVideo(event, '${title}', '${reqLevel}')">▶️ 播放線上課程 (${reqLevel}專屬)</button>`;
        }
        
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
                        ${extraHtml}
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

    const title = item['課程名稱'] || item['講師姓名'] || item['顧問姓名'] || item['店家名稱'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
    let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || '';
    const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || '';
    const linkRaw = item['報名連結'] || item['專屬付款網址'] || item['連結'] || ''; 

    let extraHtml = '';

    if (item['徵才機構']) {
        desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
    } else if (item['發文者姓名']) {
        desc = `👤 發文者：${item['發文者姓名']}\n🕒 時間：${item['發文時間']}\n\n${item['交流內容']}`;
        extraHtml = buildCommentsHtml(item['主旨/標題']||'', item['發文時間']||'', index, true);
    } else if (item['專長項目']) {
        desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
    } else if (item['店家名稱']) {
        desc = `👤 負責人：${item['負責人']}\n📍 地址：${item['地址']}\n📞 電話：${item['聯絡電話']}\n\n${item['簡介']}`;
    }

    let imagesHtml = '';
    const rawUrls = imgRaw.split(',').map(u => u.trim()).filter(u => u);
    if (rawUrls.length > 0) {
        rawUrls.forEach(url => {
            const optimized = optimizeImageUrl(url);
            imagesHtml += `<img src="${optimized}" style="width: 100%; display: block; border-bottom: 1px solid #eee;">`;
        });
    }

    let actionHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="font-size: 18px; padding: 12px 30px;">💳 了解更多 / 報名</a>` : '';
    
    if (item['最低權限要求(例如:一般會員)'] !== undefined) {
        const reqLevel = item['最低權限要求(例如:一般會員)'] || '會員';
        actionHtml = `<button class="candy-btn member-btn" style="width:100%; font-size:18px; padding: 12px 30px;" onclick="playCourseVideo(event, '${title}', '${reqLevel}')">▶️ 播放線上課程 (${reqLevel}專屬)</button>`;
    }

    document.getElementById('detail-modal-images').innerHTML = imagesHtml;
    document.getElementById('detail-modal-title').innerText = title;
    document.getElementById('detail-modal-desc').innerHTML = desc.replace(/\n/g, '<br>') + extraHtml;
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
                const timestamp = getCleanTime();
                await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '聯絡我們', newRowData: [timestamp, name, phone, line, subject, msg], action: 'submitContact' }) });
                alert('訊息已成功送出！'); contactModal.classList.remove('active');
                ['c-name', 'c-phone', 'c-line', 'c-subject', 'c-message'].forEach(id => document.getElementById(id).value = '');
            } catch (err) { alert('失敗請稍後重試'); } 
            finally { submitBtn.innerText = '確認送出'; submitBtn.disabled = false; }
        });
    }
}
