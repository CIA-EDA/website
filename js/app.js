/**
 * 檔案名稱：js/app.js
 * 職責：全站通用動態渲染引擎 (去除了容易卡死的預載邏輯，交由 CSS 處理)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('data-container');
    
    // 如果該分頁沒有需要動態載入的資料，直接結束
    if (!container) return; 

    const targetSheet = container.getAttribute('data-sheet');

    // 啟動資料庫抓取
    fetch(`${GAS_URL}?sheetName=${targetSheet}`)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success' && result.data.length > 1) {
                renderData(result.data, container);
            } else {
                container.innerHTML = '<p style="text-align:center; color:#7A7A7A;">目前資料庫尚無發佈資訊。</p>';
            }
        })
        .catch(error => {
            console.error('資料載入失敗:', error);
            container.innerHTML = '<p style="text-align:center; color:red;">資料載入異常，請稍後再試。</p>';
        });
});

// 通用卡片渲染邏輯 (對應所有 Google Sheet 分頁)
function renderData(rawData, container) {
    const headers = rawData[0];
    let html = '<div class="course-grid">';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) {
            item[headers[j]] = rawData[i][j];
        }
        
        // 智慧判斷欄位名稱，相容多種資料庫格式
        const title = item['課程名稱'] || item['講師姓名'] || item['活動名稱'] || item['名稱'] || '未命名項目';
        const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || '尚無詳細說明';
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
    container.innerHTML = html;
}
