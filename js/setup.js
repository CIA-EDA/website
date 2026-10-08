/**
 * 檔案名稱：setup.js
 * 職責：全自動建置 CLA-EDA 網站的所有分頁、確保防呆機制與動畫效果
 */

const fs = require('fs');
const path = require('path');

// 1. 建立資料夾
['css', 'js', 'images'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
});

// 2. 共用核心參數設定
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

// 3. HTML 樣板生成器 (保證全站導覽列與頁尾完全一致)
const generateHTML = (pageTitle, content, activeNav) => `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CLA-EDA | ${pageTitle}</title>
    <link rel="stylesheet" href="css/variables.css">
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Noto+Sans+TC:wght@400;500&family=Noto+Serif+TC:wght@500;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Logo 呼吸燈預載入畫面 -->
    <div id="preloader">
        <img src="images/CIAEDA_直式標準_標準彩色.png" alt="CLA-EDA Loading" class="preloader-logo">
    </div>

    <!-- 導覽列 -->
    <header>
        <a href="index.html">
            <img src="images/CIAEDA_直式標準_標準彩色.png" alt="CLA-EDA Logo" class="brand-logo-img">
        </a>
        <nav class="main-nav">
            <a href="index.html" class="${activeNav === 'index' ? 'active' : ''}">首頁</a>
            <a href="about.html" class="${activeNav === 'about' ? 'active' : ''}">關於我們</a>
            <a href="courses.html" class="${activeNav === 'courses' ? 'active' : ''}">課程介紹</a>
            <a href="certs.html" class="${activeNav === 'certs' ? 'active' : ''}">國際證照</a>
            <a href="team.html" class="${activeNav === 'team' ? 'active' : ''}">專業師資</a>
            <a href="advisors.html" class="${activeNav === 'advisors' ? 'active' : ''}">顧問與董事</a>
            <a href="gallery.html" class="${activeNav === 'gallery' ? 'active' : ''}">活動花絮</a>
            <a href="jobs.html" class="${activeNav === 'jobs' ? 'active' : ''}">徵才資訊</a>
            <a href="brands.html" class="${activeNav === 'brands' ? 'active' : ''}">品牌推廣</a>
            <a href="join.html" class="nav-btn-highlight">入會申請</a>
            <a href="${PAYUNI_URL}" target="_blank" class="nav-btn-highlight" style="background:#B8955A;">💳 線上付款</a>
        </nav>
    </header>

    <main>${content}</main>

    <!-- 浮動聯絡按鈕 -->
    <div class="floating-contact-btn" id="open-contact-btn">💬 聯絡顧問</div>

    <!-- 頁尾 -->
    <footer>
        <div class="footer-links">
            <a href="https://lin.ee/p4GvYng" target="_blank">LINE 官方帳號</a>
            <a href="https://www.facebook.com/CIAEDA/" target="_blank">Facebook</a>
            <a href="https://www.instagram.com/ciaeda111" target="_blank">Instagram</a>
            <a href="admin.html">管理員登入</a>
        </div>
        <p style="color: var(--taupe); font-size: 13px; margin: 0;">&copy; 2026 中華國際美學教育發展協會 CLA-EDA. All Rights Reserved.</p>
    </footer>

    <script src="js/app.js"></script>
</body>
</html>`;

// 4. 定義所有要產出的檔案
const files = {
    // === CSS 樣式表 (包含呼吸燈動畫與整體佈局) ===
    'css/variables.css': `
:root {
  --ink-navy: #1F2D4A; --mist-rose: #E8D3CB; --champagne: #B8955A; --pearl: #FAF7F2; --taupe: #8C8279;
  --primary-color: var(--champagne); --secondary-color: var(--pearl);
  --text-dark: var(--ink-navy); --text-light: var(--taupe);
}
body { margin: 0; font-family: 'Noto Sans TC', sans-serif; background-color: var(--secondary-color); color: var(--text-dark); display: flex; flex-direction: column; min-height: 100vh; }
main { flex: 1; }
h1, h2, h3 { font-family: 'Noto Serif TC', serif; color: var(--ink-navy); }

/* 預載入 Logo 呼吸燈 */
#preloader { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--secondary-color); display: flex; justify-content: center; align-items: center; z-index: 99999; transition: opacity 0.8s ease, visibility 0.8s ease; }
.preloader-logo { width: 150px; height: auto; animation: pulseFade 2s ease-in-out infinite; }
@keyframes pulseFade { 0% { opacity: 0.2; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } 100% { opacity: 0.2; transform: scale(0.95); } }

header { padding: 15px 30px; display: flex; justify-content: space-between; align-items: center; background-color: #050505; box-shadow: 0 2px 10px rgba(0,0,0,0.5); position: sticky; top: 0; z-index: 9000; flex-wrap: wrap; gap: 10px; }
.brand-logo-img { height: 50px; width: auto; transition: 0.3s; }
.main-nav { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
.main-nav a { color: var(--champagne); text-decoration: none; font-size: 14px; font-weight: 500; transition: 0.3s; }
.main-nav a:hover, .main-nav a.active { color: #ffffff; }
.nav-btn-highlight { color: #ffffff !important; background-color: #222; padding: 6px 12px; border-radius: 4px; }

.page-header { padding: 50px 30px; text-align: center; background-color: var(--secondary-color); }
.content-section { padding: 50px 10%; background-color: #ffffff; min-height: 50vh; }

.course-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
.course-card { border: 1px solid #eee; border-radius: 10px; overflow: hidden; background: #fff; transition: 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.course-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.08); }
.course-img { width: 100%; height: 220px; object-fit: cover; }
.course-info { padding: 25px; }

.floating-contact-btn { position: fixed; bottom: 30px; right: 30px; background-color: var(--primary-color); color: #ffffff; padding: 12px 20px; border-radius: 50px; cursor: pointer; z-index: 9998; box-shadow: 0 4px 15px rgba(184,149,90,0.4); }
footer { background-color: #050505; padding: 30px; text-align: center; }
.footer-links { display: flex; justify-content: center; gap: 20px; margin-bottom: 15px; }
.footer-links a { color: var(--champagne); text-decoration: none; font-size: 14px; }
`,

    // === JS 核心引擎 (防卡死機制) ===
    'js/app.js': `
const GAS_URL = '${GAS_URL}';

document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    
    // 【防呆機制】強制 4 秒後隱藏，保證絕對不會卡在奶茶色畫面
    const forceHide = setTimeout(() => {
        if(preloader) { preloader.style.opacity = '0'; preloader.style.visibility = 'hidden'; setTimeout(() => preloader.style.display='none', 800); }
    }, 4000);

    const container = document.getElementById('data-container');
    if (!container) return; // 如果這頁沒有資料容器，直接等強制解鎖

    const sheet = container.getAttribute('data-sheet');
    const layout = container.getAttribute('data-layout');

    fetch(\`\${GAS_URL}?sheetName=\${sheet}\`)
        .then(res => res.json())
        .then(result => {
            if(result.status === 'success' && result.data.length > 1) {
                renderData(result.data, layout, container);
            } else {
                container.innerHTML = '<p style="text-align:center;">目前尚無發佈資訊。</p>';
            }
        })
        .catch(err => console.error(err))
        .finally(() => {
            // 資料載入完畢，提早隱藏畫面，並清除防呆計時器
            clearTimeout(forceHide);
            if(preloader) { preloader.style.opacity = '0'; preloader.style.visibility = 'hidden'; setTimeout(() => preloader.style.display='none', 800); }
        });
});

function renderData(rawData, layout, container) {
    const headers = rawData[0];
    let html = '<div class="course-grid">';
    
    for(let i=1; i<rawData.length; i++) {
        let item = {};
        for(let j=0; j<headers.length; j++) item[headers[j]] = rawData[i][j];
        
        const title = item['名稱'] || item['課程名稱'] || item['活動名稱'] || item['講師姓名'] || '未命名';
        const desc = item['簡介'] || item['個人簡介'] || item['專長項目'] || '';
        const img = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || 'https://via.placeholder.com/400x300/E8D3CB/1F2D4A?text=CLA-EDA';
        
        html += \`<div class="course-card">
            <img src="\${img}" class="course-img">
            <div class="course-info">
                <h3 style="margin-top:0;">\${title}</h3>
                <p style="color:var(--text-light); font-size:14px;">\${desc}</p>
            </div>
        </div>\`;
    }
    container.innerHTML = html + '</div>';
}
`,

    // === 自動生成所有 HTML 獨立分頁 ===
    'index.html': generateHTML('首頁', `
        <section class="page-header"><h1 style="font-size:36px;">重新定義美學與專業</h1><p>打造全方位美業人才的孵化平台</p></section>
        <section class="content-section"><h2 style="text-align:center;">最新精選</h2><div id="data-container" data-sheet="課程介紹" data-layout="card"></div></section>
    `, 'index'),
    
    'about.html': generateHTML('關於我們', `
        <section class="page-header"><h1>關於協會</h1></section>
        <section class="content-section"><div style="text-align:center; max-width:800px; margin:0 auto;"><p>中華國際美學教育發展協會，致力於推動美業標準化與國際化...</p></div></section>
    `, 'about'),
    
    'courses.html': generateHTML('課程介紹', `<section class="page-header"><h1>課程介紹</h1></section><section class="content-section"><div id="data-container" data-sheet="課程介紹" data-layout="card"></div></section>`, 'courses'),
    
    'certs.html': generateHTML('國際證照資訊', `<section class="page-header"><h1>國際證照資訊</h1></section><section class="content-section"><div id="data-container" data-sheet="國際證照資訊" data-layout="card"></div></section>`, 'certs'),
    
    'team.html': generateHTML('專業師資', `<section class="page-header"><h1>專業師資團隊</h1></section><section class="content-section"><div id="data-container" data-sheet="專業師資" data-layout="card"></div></section>`, 'team'),
    
    'advisors.html': generateHTML('顧問與董事', `<section class="page-header"><h1>顧問委員與董事</h1></section><section class="content-section"><div id="data-container" data-sheet="顧問委員與董事" data-layout="card"></div></section>`, 'advisors'),
    
    'gallery.html': generateHTML('活動花絮', `<section class="page-header"><h1>活動花絮</h1></section><section class="content-section"><div id="data-container" data-sheet="活動花絮" data-layout="card"></div></section>`, 'gallery'),
    
    'jobs.html': generateHTML('徵才資訊', `<section class="page-header"><h1>徵才資訊</h1></section><section class="content-section"><div id="data-container" data-sheet="徵才資訊" data-layout="card"></div></section>`, 'jobs'),
    
    'brands.html': generateHTML('品牌推廣', `<section class="page-header"><h1>品牌推廣</h1></section><section class="content-section"><div id="data-container" data-sheet="品牌推廣" data-layout="card"></div></section>`, 'brands')
};

// 5. 執行寫入檔案
Object.keys(files).forEach(filePath => {
    fs.writeFileSync(path.join(__dirname, filePath), files[filePath].trim());
    console.log(`✅ 成功建立: ${filePath}`);
});
console.log('🎉 網站全部分頁已成功建置完畢！');
