/**
 * 檔案名稱：js/app.js
 * 職責：負責在網頁載入時，向 GAS 獲取試算表中的課程資料，並動態產生 HTML 網頁卡片
 */

// 1. 請填入你部署獨立 GAS 取得的「網頁應用程式網址」
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

// 網頁載入完成後執行
document.addEventListener('DOMContentLoaded', loadCourses);

async function loadCourses() {
    const courseContainer = document.getElementById('course-list');
    
    try {
        // 發送 GET 請求，並指定讀取 '工作表1' (依據我們的 GAS 設定)
        const response = await fetch(GAS_URL + '?sheetName=工作表1');
        const result = await response.json();

        if (result.status === 'success') {
            const rawData = result.data;
            
            // 如果資料只有標題列，或完全沒資料
            if (rawData.length <= 1) {
                courseContainer.innerHTML = '<p style="text-align:center; color: #7A7A7A;">目前尚無開放的課程資訊。</p>';
                return;
            }

            // 將試算表的二維陣列資料，轉換為 JavaScript 物件陣列，方便使用
            const headers = rawData[0];
            const courses = [];
            for (let i = 1; i < rawData.length; i++) {
                let obj = {};
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = rawData[i][j];
                }
                courses.push(obj);
            }

            // 開始渲染 HTML
            renderCourses(courses, courseContainer);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('課程載入失敗:', error);
        courseContainer.innerHTML = '<p style="text-align:center; color: red;">資料載入失敗，請稍後再試。</p>';
    }
}

/**
 * 將課程資料轉換為 HTML 格式並放入網頁
 */
function renderCourses(courses, container) {
    let html = '<div class="course-grid">';

    // 巡迴每一筆課程資料產生卡片
    courses.forEach(course => {
        // 抓取各欄位資料，若試算表中未填寫，則給予預設值防呆
        const title = course['課程名稱'] || '未命名課程';
        const desc = course['簡介'] || '暫無說明';
        const teacher = course['講師'] || 'CLA-EDA 專業團隊';
        // 若沒有圖片網址，給一張預設的高級感灰色佔位圖
        const img = course['圖片網址'] || 'https://via.placeholder.com/600x400/E8E8E8/999999?text=CLA-EDA+Course';
        const link = course['報名連結'] || '#';

        // 組合單張卡片的 HTML 結構
        html += `
            <div class="course-card">
                <img src="${img}" alt="${title}" class="course-img">
                <div class="course-info">
                    <h3 class="course-title">${title}</h3>
                    <p class="course-desc">${desc}</p>
                    <div class="course-teacher">👨‍🏫 講師：${teacher}</div>
                    <a href="${link}" target="_blank" class="course-btn">了解更多 / 立即報名</a>
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    // 將組合好的 HTML 塞進原本預留的 div 中
    container.innerHTML = html;
}
