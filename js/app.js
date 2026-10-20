/**
 * 檔案名稱：js/app.js
 * 職責：SPA 單頁面路由控制、資料庫抓取、圖片自動優化、表單送出
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
    '#join': { title: '入會申請', subtitle: '歡迎加入中華國際美學教育發展協會。為保障您的權益，請詳實填寫以下資料。', isForm: true }
};

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupContactModal();
    setupJoinForm();
    window.addEventListener('hashchange', loadPage);
    loadPage();
});

function showPreloader() {
    const p = document.getElementById('preloader');
    p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1';
}

function hidePreloader() {
    const p = document.getElementById('preloader');
    p.style.opacity = '0'; p.style.visibility = 'hidden';
    setTimeout(() => { p.style.display = 'none'; }, 500);
}

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

    if (config.isForm) {
        dataContainer.style.display = 'none';
        joinContainer.style.display = 'block';
        hidePreloader();
        return;
    }

    joinContainer.style.display = 'none';
    dataContainer.style.display = 'grid'; 
    dataContainer.innerHTML = '';

    try {
        const response = await fetch(`${GAS_URL}?sheetName=${config.sheet}`);
        const result = await response.json();
        
        if (result.status === 'success' && result.data.length > 1) {
            renderData(result.data, config.layout, dataContainer);
        } else {
            dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
        }
    } catch (error) {
        dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常。</p>';
    } finally { hidePreloader(); }
}

// === 核心優化：自動修復舊網址並轉換為低流量縮圖 ===
function optimizeImageUrl(url) {
    if (url.includes('drive.google.com') && !url.includes('thumbnail')) {
        const idMatch = url.match(/id=([^&]+)/);
        if (idMatch && idMatch[1]) {
            return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w800`;
        }
    }
    return url;
}

function generateImageHTML(imgString) {
    const rawUrls = imgString.split(',').map(u => u.trim()).filter(u => u);
    
    if (rawUrls.length === 0) return `<img src="https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA" class="course-img" style="border-radius:12px;">`;
    
    // 將所有網址丟入轉換器進行流量優化
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
            html += `
                <div class="course-card">
                    ${imgHtml}
                    <div class="course-info">
                        ${title ? `<h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>` : ''}
                        ${desc ? `<p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>` : ''}
                        ${paymentBtnHtml}
                    </div>
                </div>`;
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
            await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '聯絡我們', newRowData: [timestamp, name, phone, line, subject, msg], action: 'submitContact' })
            });
            alert('訊息已成功送出！');
            modal.classList.remove('active');
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
        const edu = document.getElementById('j-edu').value;
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
            
            await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '入會申請', newRowData: rowData, action: 'submitJoin' })
            });
            alert('申請成功！將引導至線上付款頁面。');
            window.location.href = PAYUNI_URL;
        } catch (err) { alert('傳送失敗'); }
        finally { submitBtn.innerText = '確認送出並前往付款'; submitBtn.disabled = false; }
    });
}

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
        mainNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mainNav.classList.remove('show'));
        });
    }
}
