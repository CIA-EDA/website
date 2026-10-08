/**
 * 檔案名稱：js/app.js
 * 職責：負責在網頁載入時，向 GAS 獲取試算表中的課程資料，並動態產生 HTML 網頁卡片
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 

document.addEventListener('DOMContentLoaded', loadCourses);

async function loadCourses() {
    const courseContainer = document.getElementById('course-list');
    
    try {
        const response = await fetch(GAS_URL + '?sheetName=工作表1');
        const result = await response.json();

        if (result.status === 'success') {
            const rawData = result.data;
            if (rawData.length <= 1) {
                courseContainer.innerHTML = '<p style="text-align:center; color: var(--text-light);">目前尚無開放的課程資訊。</p>';
                return;
            }

            const headers = rawData[0];
            const courses = [];
            for (let i = 1; i < rawData.length; i++) {
                let obj = {};
                for (let j = 0; j < headers.length; j++) {
                    obj[headers[j]] = rawData[i][j];
                }
                courses.push(obj);
            }
            renderCourses(courses, courseContainer);
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('課程載入失敗:', error);
        courseContainer.innerHTML = '<p style="text-align:center; color: red;">資料載入失敗，請稍後再試。</p>';
    }
}

function renderCourses(courses, container) {
    let html = '<div class="course-grid">';
    courses.forEach(course => {
        const title = course['課程名稱'] || '未命名課程';
        const desc = course['簡介'] || '暫無說明';
        const teacher = course['講師'] || 'CLA-EDA 專業團隊';
        const img = course['圖片網址'] || 'https://via.placeholder.com/600x400/E8D3CB/1F2D4A?text=CLA-EDA+Course';
        const link = course['報名連結'] || '#';

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
    container.innerHTML = html;
}
