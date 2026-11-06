/**
 * 檔案名稱：js/config.js
 * 職責：全域常數、選單設定、快取變數與共用工具函式
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const LIFF_ID = '2012121201-DRHgrrOJ'; 

const AUTH_EXPIRY_MS = 3 * 60 * 60 * 1000; 
const CACHE_EXPIRY_MS = 5 * 60 * 1000; 

const PAGE_CONFIG = {
    '': { title: '最新消息', subtitle: '掌握協會最新動態與公告。', sheet: '最新消息', layout: 'card' },
    '#home': { title: '最新消息', subtitle: '掌握協會最新動態與公告。', sheet: '最新消息', layout: 'card' },
    '#news': { title: '最新消息', subtitle: '掌握協會最新動態與公告。', sheet: '最新消息', layout: 'card' },
    '#courses': { title: '課程總覽', subtitle: '我們為您準備了豐富的實體與線上學習資源。', sheet: '課程介紹', layout: 'card' },
    '#courses-gov': { title: '政府補助課程', subtitle: '善用政府資源，提升職場競爭力。', sheet: '政府補助課程', layout: 'card' },
    '#courses-self': { title: '其他自費課程', subtitle: '專業進階培訓，投資自我成長。', sheet: '其他自費課程', layout: 'card' },
    '#course-platform': { title: '線上課程平台', subtitle: '高品質線上預錄課程與培訓資源。(觀看影片需登入會員)', sheet: '會員專屬影片', layout: 'card' },
    '#about': { title: '協會介紹', subtitle: '推動美業創新與專業標竿，我們堅信手的溫度能帶來改變。', sheet: '關於我們', layout: 'article' },
    '#gallery': { title: '精彩活動與花絮', subtitle: '見證協會與學員們共同成長的每一個珍貴時刻。', sheet: '活動花絮', layout: 'card' },
    '#team': { title: '專業師資團隊', subtitle: '頂尖業界講師群，為您帶來最扎實的實戰教學。', sheet: '專業師資', layout: 'card' },
    '#consultants': { title: '專業顧問', subtitle: '產業頂尖顧問群，提供全方位美業指導。', sheet: '專業顧問', layout: 'card' },
    '#stores': { title: '認證店家', subtitle: 'CIA-EDA 嚴選認證，提供高品質的美業服務體驗。', sheet: '認證店家', layout: 'card' },
    '#jobs': { title: '徵才專區', subtitle: '網羅最新美業職缺與招募資訊，助您找到最適合的舞台。', sheet: '徵才專區', layout: 'card' },
    '#exchange': { title: '美業資訊交流', subtitle: '會員專屬交流天地，分享最新資訊與技術探討。', sheet: '美業資訊交流', layout: 'card' },
    '#brands': { title: '品牌推廣與合作', subtitle: '嚴選業界頂尖品牌，共創美業生態圈。', sheet: '品牌推廣', layout: 'brand' }, 
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。為保障您的權益，請詳實填寫以下資料。', isJoinIntent: true },
    '#member-zone': { title: '會員專屬大廳', subtitle: '掌握最新行業動態與您的專屬權限', isMember: true },
    '#edit-profile': { title: '修改個人設定', subtitle: '保持最新的聯絡資訊，確保會員權益', isEditProfile: true }
};

let currentTrackingHash = window.location.hash || '#news';
let currentPageEntryTime = Date.now();
let currentViewDataCache = [];
window.currentCommentsCache = [];

function getCleanTime() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
}

function getSafeMemberInfo() {
    try {
        let info = localStorage.getItem('cia_member_info');
        return (info === 'undefined' || info === 'null') ? null : JSON.parse(info);
    } catch(e) { localStorage.removeItem('cia_member_info'); return null; }
}

function getSafeCredentials() {
    try {
        let creds = localStorage.getItem('cia_member_credentials');
        return (creds === 'undefined' || creds === 'null') ? null : JSON.parse(creds);
    } catch(e) { localStorage.removeItem('cia_member_credentials'); return null; }
}

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

const readFileAsBase64 = (file) => new Promise((res, rej) => { 
    const r = new FileReader(); 
    r.onload = () => res(r.result.split(',')[1]); 
    r.readAsDataURL(file); 
});

function optimizeImageUrl(url) {
    if (url.includes('drive.google.com') && !url.includes('thumbnail')) {
        const idMatch = url.match(/id=([^&]+)/);
        if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
    }
    return url;
}

function generateImageHTML(imgString) {
    const rawUrls = imgString.split(',').map(u => u.trim()).filter(u => u);
    if (rawUrls.length === 0) return '';
    const urls = rawUrls.map(url => optimizeImageUrl(url));
    if (urls.length === 1) return `<div class="img-wrapper"><img src="${urls[0]}" alt="Image"></div>`;
    
    let html = `<div class="img-wrapper"><div class="carousel-container">`;
    urls.forEach(url => { html += `<img src="${url}" alt="Image">`; });
    html += `</div></div><div class="carousel-hint">← 左右滑動查看多圖 →</div>`;
    return html;
}
