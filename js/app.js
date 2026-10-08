/**
 * 檔案名稱：js/app.js
 * 職責：全站通用動態渲染引擎 (具備防卡死機制，並支援「卡片」與「文章」多種版型切換)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    
    // 【防呆機制】強制 4 秒後隱藏預載入畫面，保證絕對不卡頓
    const forceHideTimeout = setTimeout(() => {
        hidePreloader(preloader);
    }, 4000);

    const container = document.getElementById('data-container');
    if (!container) return; 

    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout') || 'card'; // 預設使用卡片版型

    // 啟動資料庫抓取
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

function hidePreloader(preloaderElement) {
    if (preloaderElement) {
        preloaderElement.style.opacity = '0';
        preloaderElement.style.visibility = 'hidden';
        setTimeout(() => { preloaderElement.style.display = 'none'; }, 800);
    }
}

// 通用資料渲染邏輯 (支援多版型)
function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    let html = '';
    
    // ---------------------------------------------------------
    // 版型 1：文章排版 (適合「關於我們」等長篇圖文)
    // ---------------------------------------------------------
    if (layoutType === 'article') {
        html += '<div style="max-width: 800px; margin: 0 auto;">'; // 將文章置中並限制寬度，提升閱讀體驗
        
        for (let i = 1; i < rawData.length; i++) {
            let item = {};
            for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
            
            const title = item['標題'] || item['名稱'] || '';
            const content = item['內容'] || item['簡介'] || '';
            const img = item['圖片網址'] || item['照片網址'] || '';
            
            html += `<div style="margin-bottom: 50px;">`;
            if (title) {
                html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            }
            if (img) {
                html += `<img src="${img}" alt="${title}" style="width:100%; border-radius:10px; margin-bottom:20px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">`;
            }
            if (content) {
                // .replace(/\n/g, '<br>') 可以讓 Google Sheet 裡的換行正常顯示在網頁上
                html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${content.replace(/\n/g, '<br>')}</p>`;
            }
            html += `</div>`;
        }
        html += '</div>';
    } 
    // ---------------------------------------------------------
    // 版型 2：網格卡片排版 (適合課程、師資、品牌推廣等，此為預設)
    // ---------------------------------------------------------
    else {
        html += '<div class="course-grid">';
        
        for (let i = 1; i < rawData.length; i++) {
            let item = {};
            for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
            
            const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['名稱'] || item['標題'] || '未命名項目';
            const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || item['內容'] || '尚無詳細說明';
            const img = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || 'https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CLA-EDA';
            
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
