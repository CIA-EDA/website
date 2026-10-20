/**
 * 檔案名稱：js/course.js
 * 職責：獨立金庫的嚴格二次驗證、阻擋無授權者、動態渲染影片
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

document.addEventListener('DOMContentLoaded', async () => {
    const securityLayer = document.getElementById('security-layer');
    const msg = document.getElementById('security-msg');
    const vault = document.getElementById('video-vault');

    // 1. 抓取入口大門發給的通行證
    const credentials = JSON.parse(localStorage.getItem('cia_member_credentials') || 'null');
    
    if (!credentials) {
        msg.innerHTML = '<span style="color:#e53e3e;">拒絕存取：未偵測到合法憑證，即將跳轉回首頁。</span>';
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        return;
    }

    // 2. 向後端發起嚴格的二次驗證與資料請求
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                token: API_SECRET_TOKEN,
                action: 'verifyAndGetCourses',
                credentials: credentials // 將帳密或 LINE UID 丟給後端檢查
            })
        });

        const result = await response.json();

        if (result.status === 'success') {
            // 審核通過，解鎖畫面並渲染影片
            securityLayer.style.display = 'none';
            renderVideos(result.data, vault);
        } else {
            // 審核失敗 (可能是過期、停用等)
            msg.innerHTML = `<span style="color:#e53e3e;">驗證失敗：${result.message}<br>即將跳轉回首頁。</span>`;
            localStorage.removeItem('cia_member_credentials'); // 清除無效憑證
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        }

    } catch (error) {
        msg.innerHTML = '<span style="color:#e53e3e;">伺服器連線異常，請稍後再試。</span>';
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    }
});

function renderVideos(rawData, container) {
    if (rawData.length <= 1) {
        container.innerHTML = '<p style="color:#a0aec0;">目前無可觀看的專屬影片。</p>';
        return;
    }
    
    const headers = rawData[0];
    let html = '';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        
        const title = item['課程名稱'] || '未命名課程';
        const desc = item['課程簡介'] || '';
        const vidUrl = item['影片嵌入網址'] || '';
        const coverUrl = item['封面圖片網址'] || '';

        // 若無影片網址，顯示封面圖 (需做縮圖處理防破圖)
        let mediaHtml = '';
        if (vidUrl) {
            mediaHtml = `<div class="video-container"><iframe src="${vidUrl}" allowfullscreen></iframe></div>`;
        } else if (coverUrl) {
            let optimized = coverUrl.includes('drive.google.com') && !coverUrl.includes('thumbnail') 
                ? `https://drive.google.com/thumbnail?id=${coverUrl.match(/id=([^&]+)/)[1]}&sz=w800` 
                : coverUrl;
            mediaHtml = `<div class="video-container"><img src="${optimized}" style="width:100%; height:100%; object-fit:cover;"></div>`;
        }

        html += `
            <div class="course-card">
                ${mediaHtml}
                <div class="course-info">
                    <h3 class="course-title">${title}</h3>
                    <p class="course-desc">${desc.replace(/\n/g, '<br>')}</p>
                </div>
            </div>`;
    }
    
    container.innerHTML = html;
}
