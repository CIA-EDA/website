/**
 * 檔案名稱：js/app.js
 * 職責：全站通用動態渲染引擎、手機版選單控制 (前台已徹底移除後台入口)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 手機版圖框式按鈕 (漢堡選單) 切換邏輯 ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => {
            mainNav.classList.toggle('show');
        });
    }

    // --- 2. 資料庫自動抓取與防呆邏輯 ---
    const preloader = document.getElementById('preloader');
    const forceHideTimeout = setTimeout(() => { hidePreloader(preloader); }, 4000);
    const container = document.getElementById('data-container');
    
    if (!container) return; 

    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout') || 'card';

    fetch(`${GAS_URL}?sheetName=${targetSheet}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 1) {
                renderData(result.data, layoutType, container);
            } else {
                container.innerHTML = '<p style="text-align:center; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
            }
        })
        .catch(error => {
            console.error('資料載入失敗:', error);
            container.innerHTML = '<p style="text-align:center; color:red;">資料載入異常，請稍後再試。</p>';
        })
        .finally(() => {
            hidePreloader(preloader);
            clearTimeout(forceHideTimeout);
        });
});

// 隱藏預載動畫的共用函數
function hidePreloader(preloaderElement) {
    if (preloaderElement) {
        preloaderElement.style.opacity = '0';
        preloaderElement.style.visibility = 'hidden';
        setTimeout(() => { preloaderElement.style.display = 'none'; }, 800);
    }
}

// 通用資料渲染邏輯 (支援卡片與文章版型)
function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    let html = '';
    
    if (layoutType === 'article') {
        html += '<div style="max-width: 800px; margin: 0 auto;">'; 
        for (let i = 1; i < rawData.length; i++) {
            let item = {};
            for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
            
            const title = item['標題'] || item['名稱'] || '';
            const content = item['內容'] || item['簡介'] || '';
            const img = item['圖片網址'] || item['照片網址'] || '';
            
            html += `<div style="margin-bottom: 50px;">`;
            if (title) html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            if (img) html += `<img src="${img}" alt="${title}" style="width:100%; border-radius:10px; margin-bottom:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">`;
            if (content) html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${content.replace(/\n/g, '<br>')}</p>`;
            html += `</div>`;
        }
        html += '</div>';
    } else {
        html += '<div class="course-grid">';
        for (let i = 1; i < rawData.length; i++) {
            let item = {};
            for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
            
            const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['名稱'] || item['標題'] || '未命名項目';
            const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['內容'] || '尚無詳細說明';
            const img = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || 'https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CIA-EDA';
            
            html += `
                <div class="course-card">
                    <img src="${img}" alt="${title}" class="course-img">
                    <div class="course-info">
                        <h3 style="margin-top:0; color:var(--ink-navy);">${title}</h3>
                        <p style="color:var(--text-light); font-size:14px; line-height:1.5;">${desc}</p>
                    </div>
                </div>
            `;
        }
        html += '</div>';
    }
    container.innerHTML = html;
}
