const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));

    const preloader = document.getElementById('preloader');
    const forceHideTimeout = setTimeout(() => { hidePreloader(preloader); }, 4000);
    const container = document.getElementById('data-container');
    if (!container) return; 

    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout') || 'card';

    fetch(`${GAS_URL}?sheetName=${targetSheet}`)
        .then(res => res.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 1) renderData(result.data, layoutType, container);
            else container.innerHTML = '<p style="text-align:center; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
        })
        .catch(err => { container.innerHTML = '<p style="text-align:center; color:red;">資料載入異常。</p>'; })
        .finally(() => { hidePreloader(preloader); clearTimeout(forceHideTimeout); });
});

function hidePreloader(el) { if (el) { el.style.opacity = '0'; el.style.visibility = 'hidden'; setTimeout(() => { el.style.display = 'none'; }, 800); } }

// === 核心：處理多圖輪播 (Carousel) ===
function generateImageHTML(imgString) {
    const urls = imgString.split(',').map(u => u.trim()).filter(u => u);
    if (urls.length === 0) return `<img src="https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA" class="course-img" style="border-radius:12px;">`;
    if (urls.length === 1) return `<img src="${urls[0]}" class="course-img" style="border-radius:12px;">`;
    
    // 如果有多張圖片，自動生成流暢的 CSS 滑動輪播區塊
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
        
        const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['名稱'] || item['標題'] || '未命名項目';
        const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['內容'] || '尚無詳細說明';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || '';
        const imgHtml = generateImageHTML(imgRaw);
        
        if (layoutType === 'article') {
            html += `<div style="margin-bottom: 50px;">`;
            if (title) html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            html += imgHtml;
            if (desc) html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${desc.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
        } else {
            html += `
                <div class="course-card">
                    ${imgHtml}
                    <div class="course-info">
                        <h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>
                        <p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>
                    </div>
                </div>`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}
