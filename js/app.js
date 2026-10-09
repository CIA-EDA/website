const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 手機版選單切換
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));

    // 2. 清除舊有按鈕，動態注入統一的「聯絡我們」模組
    const oldBtn = document.querySelector('.floating-contact-btn');
    if (oldBtn) oldBtn.remove();
    
    const contactHTML = `
        <div class="floating-contact-btn" id="open-contact-btn">💬 聯絡我們</div>
        <div class="modal-overlay" id="contact-modal">
            <div class="modal-content">
                <button class="modal-close" id="close-contact-btn">&times;</button>
                <h2 style="color:var(--ink-navy); margin-top:0; text-align:center;">聯絡我們</h2>
                <p style="text-align:center; color:var(--text-light); font-size:14px; margin-bottom:20px;">有任何問題？請填寫下方表單，協會顧問將盡快與您聯繫。</p>
                <div class="form-group-modal"><label>姓名 Name *</label><input type="text" id="c-name" placeholder="請輸入姓名"></div>
                <div class="form-group-modal"><label>聯絡電話 Phone *</label><input type="tel" id="c-phone" placeholder="請輸入電話"></div>
                <div class="form-group-modal"><label>LINE ID (選填)</label><input type="text" id="c-line" placeholder="方便顧問聯繫"></div>
                <div class="form-group-modal"><label>詢問主旨 Subject *</label><input type="text" id="c-subject" placeholder="例如：課程詢問、合作提案"></div>
                <div class="form-group-modal"><label>詳細內容 Message *</label><textarea id="c-message" placeholder="請填寫您的問題或需求"></textarea></div>
                <button class="candy-btn" id="submit-contact-btn" style="width:100%; border-radius:8px; margin-top:10px; border:none;">確認送出</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', contactHTML);

    const contactModal = document.getElementById('contact-modal');
    document.getElementById('open-contact-btn').addEventListener('click', () => contactModal.classList.add('active'));
    document.getElementById('close-contact-btn').addEventListener('click', () => contactModal.classList.remove('active'));

    document.getElementById('submit-contact-btn').addEventListener('click', async (e) => {
        const name = document.getElementById('c-name').value.trim();
        const phone = document.getElementById('c-phone').value.trim();
        const line = document.getElementById('c-line').value.trim();
        const subject = document.getElementById('c-subject').value.trim();
        const message = document.getElementById('c-message').value.trim();

        if (!name || !phone || !subject || !message) { alert('請填寫姓名、電話、主旨與內容！'); return; }
        const btn = e.target; btn.innerText = "加密傳送中..."; btn.disabled = true;

        try {
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            const response = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '聯絡我們', newRowData: [timestamp, name, phone, line, subject, message] })
            });
            const result = await response.json();
            if(result.status === 'success') { alert('訊息已成功送出！'); contactModal.classList.remove('active'); } 
            else throw new Error(result.message);
        } catch (err) { alert('發送失敗：' + err.message); }
        finally { btn.innerText = "確認送出"; btn.disabled = false; }
    });

    // 3. 入會申請表單邏輯 (集中寫在 app.js，讓全站只需讀取一支 JS)
    const submitJoinBtn = document.getElementById('btn-submit-join');
    if (submitJoinBtn) {
        submitJoinBtn.addEventListener('click', async () => {
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

            const fields = Array.from(document.querySelectorAll('input[name="j-field"]:checked')).map(cb => cb.value).join(' , ');
            const sources = Array.from(document.querySelectorAll('input[name="j-source"]:checked')).map(cb => cb.value).join(' , ');
            const expects = Array.from(document.querySelectorAll('input[name="j-expect"]:checked')).map(cb => cb.value).join(' , ');
            const membershipNode = document.querySelector('input[name="j-membership"]:checked');
            const membership = membershipNode ? membershipNode.value : '';
            const newsletterNode = document.querySelector('input[name="j-newsletter"]:checked');
            const newsletter = newsletterNode ? newsletterNode.value : '';

            if (!nameZh || !birth || !idNum || !edu || !fields || !company || !phone || !address || !membership || !expects || !newsletter) {
                alert('請務必填寫所有標示星號 (*) 的必填欄位！'); return;
            }

            submitJoinBtn.innerText = '資料加密傳送中，請稍候...'; submitJoinBtn.disabled = true;

            try {
                const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
                const newRowData = [timestamp, nameZh, nameEn, birth, idNum, edu, fields, company, jobTitle, phone, line, email, address, membership, sources, expects, newsletter, remarks];
                
                const response = await fetch(GAS_URL, {
                    method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '入會申請', newRowData: newRowData })
                });
                const result = await response.json();
                if (result.status === 'success') { alert('申請送出成功！即將前往付款頁面。'); window.location.href = PAYUNI_URL; } 
                else throw new Error(result.message);
            } catch (error) { alert('傳送失敗：' + error.message); submitJoinBtn.innerText = '確認送出並前往付款'; submitJoinBtn.disabled = false; }
        });
    }

    // 4. 動態資料庫抓取與輪播圖渲染
    const preloader = document.getElementById('preloader');
    const forceHideTimeout = setTimeout(() => { if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.display = 'none'; }, 800); } }, 4000);
    const container = document.getElementById('data-container');
    if (!container) return; 

    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout') || 'card';

    fetch(`${GAS_URL}?sheetName=${targetSheet}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 1) {
                const headers = result.data[0];
                let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto;">' : '<div class="course-grid">';
                
                for (let i = 1; i < result.data.length; i++) {
                    let item = {};
                    for (let j = 0; j < headers.length; j++) item[headers[j]] = result.data[i][j];
                    const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || '未命名項目';
                    const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['產品簡介'] || item['內容'] || '';
                    const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || '';
                    const linkRaw = item['報名連結'] || item['專屬付款網址'] || ''; 
                    
                    let imgHtml = '';
                    const urls = imgRaw.split(',').map(u => u.trim()).filter(u => u);
                    if (urls.length === 0) imgHtml = `<img src="https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA" class="course-img" style="border-radius:12px;">`;
                    else if (urls.length === 1) imgHtml = `<img src="${urls[0]}" class="course-img" style="border-radius:12px;">`;
                    else {
                        imgHtml = `<div style="display:flex; overflow-x:auto; scroll-snap-type: x mandatory; border-radius:12px; margin-bottom:10px;">`;
                        urls.forEach(url => { imgHtml += `<img src="${url}" style="flex: 0 0 100%; scroll-snap-align: start; width:100%; height:200px; object-fit:cover;">`; });
                        imgHtml += `</div><div style="text-align:center; font-size:12px; color:var(--taupe); margin-top:-5px; margin-bottom:10px;">← 滑動查看 →</div>`;
                    }
                    
                    const paymentBtnHtml = linkRaw !== '' ? `<a href="${linkRaw}" target="_blank" class="candy-btn" style="display:block; margin-top:20px;">💳 專屬線上付款</a>` : '';
                    
                    if (layoutType === 'article') {
                        html += `<div style="margin-bottom: 50px;"><h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>${imgHtml}<p style="font-size:16px; line-height:1.8;">${desc.replace(/\n/g, '<br>')}</p>${paymentBtnHtml}</div>`;
                    } else {
                        html += `<div class="course-card">${imgHtml}<div class="course-info"><h3 style="margin-top:0;">${title}</h3><p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>${paymentBtnHtml}</div></div>`;
                    }
                }
                html += '</div>';
                container.innerHTML = html;
            } else { container.innerHTML = '<p style="text-align:center;">目前資料庫尚無發佈資訊。</p>'; }
        })
        .finally(() => { if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.display = 'none'; }, 800); } clearTimeout(forceHideTimeout); });
});
