/**
 * 檔案名稱：js/app.js
 * 職責：處理資料渲染、手機選單、精準控制「聯絡我們」彈出視窗
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 手機版漢堡選單 ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));
    }

    // --- 2. 動態生成並控制「聯絡我們」彈出視窗 ---
    createContactModal();
    setupContactModalEvents();

    // --- 3. 處理預載入畫面 (防卡死) ---
    const preloader = document.getElementById('preloader');
    const forceHideTimeout = setTimeout(() => { hidePreloader(preloader); }, 4000);

    // --- 4. 抓取資料庫內容渲染頁面 ---
    const container = document.getElementById('data-container');
    if (!container) {
        hidePreloader(preloader);
        clearTimeout(forceHideTimeout);
        return; 
    }

    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout') || 'card';

    fetch(`${GAS_URL}?sheetName=${targetSheet}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 1) {
                renderData(result.data, layoutType, container);
            } else {
                container.innerHTML = '<p style="text-align:center; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
            }
        })
        .catch(err => { 
            console.error(err);
            container.innerHTML = '<p style="text-align:center; color:red;">資料載入異常。</p>'; 
        })
        .finally(() => { 
            hidePreloader(preloader); 
            clearTimeout(forceHideTimeout); 
        });
});

// --- 隱藏預載動畫 ---
function hidePreloader(el) { 
    if (el) { el.style.opacity = '0'; el.style.visibility = 'hidden'; setTimeout(() => { el.style.display = 'none'; }, 800); } 
}

// --- 動態創建聯絡表單 Modal (確保結構乾淨) ---
function createContactModal() {
    // 建立按鈕
    const floatBtn = document.createElement('div');
    floatBtn.className = 'floating-contact-btn';
    floatBtn.id = 'open-contact-btn';
    floatBtn.innerHTML = '💬 聯絡協會';
    document.body.appendChild(floatBtn);

    // 建立 Modal
    const modalHTML = `
        <div id="contact-modal" class="modal-overlay">
            <div class="modal-content">
                <button class="modal-close-btn" id="close-contact-btn">&times;</button>
                <h2 style="text-align:center; color:var(--ink-navy); margin-top:0; font-family:'Noto Serif TC', serif;">聯絡我們</h2>
                <p style="text-align:center; color:var(--taupe); font-size:14px; margin-bottom:20px;">有任何問題？請填寫下方表單，協會顧問將盡快與您聯繫。</p>
                
                <div class="form-group"><label>姓名 Name *</label><input type="text" id="c-name" class="input-field" placeholder="請輸入姓名"></div>
                <div class="form-group"><label>聯絡電話 Phone *</label><input type="tel" id="c-phone" class="input-field" placeholder="請輸入電話"></div>
                <div class="form-group"><label>LINE ID (選填)</label><input type="text" id="c-line" class="input-field" placeholder="方便顧問聯繫"></div>
                <div class="form-group"><label>詢問主旨 Subject *</label><input type="text" id="c-subject" class="input-field" placeholder="例如：課程詢問、合作提案"></div>
                <div class="form-group"><label>詳細內容 Message *</label><textarea id="c-message" class="textarea-field" placeholder="請填寫您的問題或需求"></textarea></div>
                
                <button id="submit-contact-btn" class="submit-btn-full">確認送出</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// --- 設定聯絡表單的開關與送出事件 ---
function setupContactModalEvents() {
    const modal = document.getElementById('contact-modal');
    const openBtn = document.getElementById('open-contact-btn');
    const closeBtn = document.getElementById('close-contact-btn');
    const submitBtn = document.getElementById('submit-contact-btn');

    // 開關控制 (精準使用 classList.add/remove)
    openBtn.addEventListener('click', () => modal.classList.add('active'));
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    // 點擊背景關閉
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // 處理送出
    submitBtn.addEventListener('click', async () => {
        const name = document.getElementById('c-name').value.trim();
        const phone = document.getElementById('c-phone').value.trim();
        const line = document.getElementById('c-line').value.trim();
        const subject = document.getElementById('c-subject').value.trim();
        const message = document.getElementById('c-message').value.trim();

        if (!name || !phone || !subject || !message) {
            alert('請填寫所有標示 * 的必填欄位！'); return;
        }

        const ogText = submitBtn.innerText;
        submitBtn.innerText = '傳送中...';
        submitBtn.disabled = true;

        try {
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            // 資料對應 DB_SCHEMA 的 '聯絡我們'
            const rowData = [timestamp, name, phone, line, subject, message];

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '聯絡我們', // 將建立專屬 Sheet
                    newRowData: rowData,
                    action: 'submitContact' // 告訴後端這是聯絡表單，需寄信
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                alert('訊息已成功送出！顧問將盡快與您聯繫。');
                modal.classList.remove('active');
                // 清空表單
                document.getElementById('c-name').value = '';
                document.getElementById('c-phone').value = '';
                document.getElementById('c-line').value = '';
                document.getElementById('c-subject').value = '';
                document.getElementById('c-message').value = '';
            } else { throw new Error(result.message); }
        } catch (error) {
            alert('傳送失敗，請稍後再試：' + error.message);
        } finally {
            submitBtn.innerText = ogText;
            submitBtn.disabled = false;
        }
    });
}

// --- 渲染卡片/文章資料 (含輪播圖產生) ---
function generateImageHTML(imgString) {
    const urls = imgString.split(',').map(u => u.trim()).filter(u => u);
    if (urls.length === 0) return `<img src="https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA" class="course-img" style="border-radius:12px;">`;
    if (urls.length === 1) return `<img src="${urls[0]}" class="course-img" style="border-radius:12px;">`;
    
    let html = `<div style="display:flex; overflow-x:auto; scroll-snap-type: x mandatory; border-radius:12px; margin-bottom:10px;">`;
    urls.forEach(url => { html += `<img src="${url}" style="flex: 0 0 100%; scroll-snap-align: start; width:100%; height:200px; object-fit:cover;">`; });
    html += `</div><div style="text-align:center; font-size:12px; color:var(--taupe); margin-top:-5px; margin-bottom:10px;">← 左右滑動查看多圖 →</div>`;
    return html;
}

function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto;">' : '<div class="course-grid">';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        
        const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['產品名稱'] || item['名稱'] || item['標題'] || '未命名項目';
        const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['產品簡介'] || item['內容'] || '尚無詳細說明';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || '';
        const linkRaw = item['報名連結'] || item['專屬付款網址'] || ''; 
        
        const imgHtml = generateImageHTML(imgRaw);
        
        let paymentBtnHtml = '';
        if (linkRaw !== '') {
            paymentBtnHtml = `<a href="${linkRaw}" target="_blank" class="candy-btn" style="display:block; text-align:center; margin-top:20px; background:var(--champagne); color:#fff !important;">💳 專屬線上付款</a>`;
        }
        
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
                        <h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>
                        <p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>
                        ${paymentBtnHtml}
                    </div>
                </div>`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}
