/**
 * 檔案名稱：setup.js
 * 職責：全自動建置 CLA-EDA 網站的資料夾結構與核心檔案
 */

const fs = require('fs');
const path = require('path');

// 1. 定義需要建立的資料夾結構
const directories = ['css', 'js', 'images'];

// 2. 建立資料夾的函數
directories.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        console.log(`📁 成功建立資料夾: ${dir}`);
    }
});

// 3. 定義需要寫入的檔案與內容 (使用樣板字面值包覆我們之前寫好的程式碼)
const files = {
    // 品牌色彩設定檔
    'css/variables.css': `
:root {
  --ink-navy: #1F2D4A;
  --mist-rose: #E8D3CB;
  --champagne: #B8955A;
  --pearl: #FAF7F2;
  --taupe: #8C8279;
  --primary-color: var(--champagne);
  --secondary-color: var(--pearl);
  --text-dark: var(--ink-navy);
  --text-light: var(--taupe);
}
body { background-color: var(--secondary-color); color: var(--text-dark); letter-spacing: 0.05em; scroll-behavior: smooth; }
`,
    
    // 前台動態渲染引擎
    'js/app.js': `
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
document.addEventListener('DOMContentLoaded', initApp);
async function initApp() {
    const container = document.getElementById('data-container');
    const preloader = document.getElementById('preloader');
    if (!container) return hidePreloader(preloader);
    
    const targetSheet = container.getAttribute('data-sheet');
    const layoutType = container.getAttribute('data-layout');
    
    try {
        const response = await fetch(\`\${GAS_URL}?sheetName=\${targetSheet}\`);
        const result = await response.json();
        
        if (result.status === 'success') {
            const rawData = result.data;
            if (rawData.length <= 1) {
                container.innerHTML = '<p style="text-align:center;">目前尚無相關資訊發佈。</p>';
                return;
            }
            
            const headers = rawData[0];
            const items = [];
            for (let i = 1; i < rawData.length; i++) {
                let obj = {};
                for (let j = 0; j < headers.length; j++) obj[headers[j]] = rawData[i][j];
                items.push(obj);
            }
            
            if (layoutType === 'course') renderCourses(items, container);
            else if (layoutType === 'team') renderTeam(items, container);
        }
    } catch (error) {
        console.error('資料載入失敗:', error);
    } finally {
        hidePreloader(preloader);
    }
}
function hidePreloader(preloader) {
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => { preloader.style.display = 'none'; }, 800);
    }
}
function renderCourses(courses, container) {
    let html = '<div class="course-grid">';
    courses.forEach(course => {
        html += \`<div class="course-card" style="border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fff;">
            <h3>\${course['課程名稱'] || '未命名'}</h3>
            <p>\${course['簡介'] || ''}</p>
        </div>\`;
    });
    container.innerHTML = html + '</div>';
}
function renderTeam(members, container) {
    let html = '<div class="course-grid">';
    members.forEach(member => {
        html += \`<div class="course-card" style="border: 1px solid #eee; padding: 20px; border-radius: 8px; background: #fff;">
            <h3>\${member['講師姓名'] || '專業講師'}</h3>
            <p>\${member['專長項目'] || ''}</p>
        </div>\`;
    });
    container.innerHTML = html + '</div>';
}
`,

    // 首頁
    'index.html': `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>CLA-EDA | 中華國際美學教育發展協會</title>
    <link rel="stylesheet" href="css/variables.css">
</head>
<body>
    <div id="preloader" style="position:fixed; top:0; left:0; width:100%; height:100%; background:var(--secondary-color); display:flex; justify-content:center; align-items:center; z-index:9999; transition:0.8s;">
        <h2 style="color:var(--ink-navy);">CLA-EDA</h2>
    </div>
    <header style="padding: 20px 50px; background: #fff; display:flex; justify-content:space-between;">
        <img src="images/CIAEDA_直式標準_標準彩色.png" alt="Logo" style="height:50px;">
        <nav style="display:flex; gap:20px;">
            <a href="index.html">首頁</a>
            <a href="team.html">專業師資</a>
            <a href="admin.html">管理後台</a>
        </nav>
    </header>
    <div style="padding: 50px;">
        <h2 style="color:var(--ink-navy); text-align:center;">精選課程</h2>
        <div id="data-container" data-sheet="課程介紹" data-layout="course"></div>
    </div>
    <script src="js/app.js"></script>
</body>
</html>
`,

    // 師資頁面
    'team.html': `
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>CLA-EDA | 專業師資</title>
    <link rel="stylesheet" href="css/variables.css">
</head>
<body>
    <div id="preloader" style="position:fixed; top:0; left:0; width:100%; height:100%; background:var(--secondary-color); display:flex; justify-content:center; align-items:center; z-index:9999; transition:0.8s;">
        <h2 style="color:var(--ink-navy);">CLA-EDA</h2>
    </div>
    <header style="padding: 20px 50px; background: #fff; display:flex; justify-content:space-between;">
        <img src="images/CIAEDA_直式標準_標準彩色.png" alt="Logo" style="height:50px;">
        <nav style="display:flex; gap:20px;">
            <a href="index.html">首頁</a>
            <a href="team.html">專業師資</a>
            <a href="admin.html">管理後台</a>
        </nav>
    </header>
    <div style="padding: 50px;">
        <h2 style="color:var(--ink-navy); text-align:center;">專業師資團隊</h2>
        <div id="data-container" data-sheet="專業師資" data-layout="team"></div>
    </div>
    <script src="js/app.js"></script>
</body>
</html>
`
};

// 4. 寫入檔案的函數
Object.keys(files).forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    fs.writeFileSync(fullPath, files[filePath].trim());
    console.log(`📄 成功建立檔案: ${filePath}`);
});

console.log('✅ 網站基礎架構建置完成！');
