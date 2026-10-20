/**
 * 檔案名稱：js/admin.js
 * 職責：處理動態表單生成、資料庫列表呈現、刪除與排序操作
 */

const ADMIN_PASSWORD = '6668888';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

// 定義各分類對應的欄位 (扣除圖檔)
const FORM_FIELDS = {
    '課程介紹': [{name:'課程名稱', type:'text'}, {name:'簡介', type:'textarea'}, {name:'講師', type:'text'}, {name:'專屬付款網址', type:'text'}],
    '專業師資': [{name:'講師姓名', type:'text'}, {name:'專長項目', type:'text'}, {name:'個人簡介', type:'textarea'}, {name:'聯絡方式(IG/Line)', type:'text'}],
    '活動花絮': [{name:'活動名稱', type:'text'}, {name:'日期', type:'text'}],
    '關於我們': [{name:'標題', type:'text'}, {name:'內容', type:'textarea'}],
    '品牌推廣': [{name:'產品名稱', type:'text'}, {name:'產品簡介', type:'textarea'}]
};

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

document.addEventListener('DOMContentLoaded', () => {
    // 登入驗證
    const pwdInput = document.getElementById('admin-pwd');
    document.getElementById('btn-login').addEventListener('click', () => {
        if(pwdInput.value === ADMIN_PASSWORD) document.getElementById('login-overlay').style.display = 'none';
        else { alert('Access Denied'); pwdInput.value = ''; }
    });

    // 側邊欄切換
    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
        });
    });

    // === 動態表單生成邏輯 ===
    const catSelect = document.getElementById('category-select');
    const formContainer = document.getElementById('dynamic-form-container');
    
    const renderForm = () => {
        const cat = catSelect.value;
        const fields = FORM_FIELDS[cat];
        let html = '';
        fields.forEach(f => {
            if(f.type === 'textarea') html += `<div class="form-group"><label>${f.name}</label><textarea class="textarea-field data-input" data-name="${f.name}"></textarea></div>`;
            else html += `<div class="form-group"><label>${f.name}</label><input type="text" class="input-field data-input" data-name="${f.name}"></div>`;
        });
        html += `<div class="form-group"><label>上傳圖片/照片/Logo (可選多張)</label><input type="file" id="upload-files" class="input-field" accept="image/*" multiple><div style="font-size:12px; color:#888; margin-top:5px;">圖片將自動上傳並分類至該單元的專屬資料夾</div></div>`;
        formContainer.innerHTML = html;
    };
    catSelect.addEventListener('change', renderForm);
    renderForm(); // 初始化

    // === 發佈資料邏輯 ===
    document.getElementById('btn-submit-data').addEventListener('click', async (e) => {
        const btn = e.target;
        const cat = catSelect.value;
        const inputs = Array.from(formContainer.querySelectorAll('.data-input'));
        
        if(!inputs[0].value.trim()) { alert('請填寫主要名稱/標題'); return; }

        const ogText = btn.innerText; btn.innerText = '處理中...'; btn.disabled = true;

        try {
            const newRowData = [];
            // Google Sheet 的欄位排序規則：(依照 Code.gs 的 DB_SCHEMA)
            // 這裡我們為了簡化，前端上傳時將圖片網址固定塞在倒數第二格 (或對應位置)
            // 課程: 課程名稱, 簡介, 講師, 圖片網址, 專屬付款網址
            // 師資: 講師姓名, 專長項目, 個人簡介, 照片網址, 聯絡方式
            // 活動: 活動名稱, 日期, 活動照片網址
            // 關於: 標題, 內容, 圖片網址
            // 品牌: 產品名稱, 產品簡介, 產品logo及圖檔
            
            // 處理圖片上傳
            const fileInput = document.getElementById('upload-files');
            let imgUrls = '';
            if(fileInput.files.length > 0) {
                const urls = [];
                for(let i=0; i<fileInput.files.length; i++) {
                    btn.innerText = `上傳圖片 (${i+1}/${fileInput.files.length})...`;
                    const base64Data = await readFileAsBase64(fileInput.files[i]);
                    const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: cat, base64Data: base64Data, mimeType: fileInput.files[i].type, fileName: fileInput.files[i].name }) });
                    const resData = await res.json();
                    if(resData.status === 'success') urls.push(resData.url);
                }
                imgUrls = urls.join(',');
            }

            // 依據類別組裝資料陣列
            if(cat === '課程介紹') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '專業師資') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '活動花絮') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '關於我們') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '品牌推廣') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);

            btn.innerText = '寫入資料庫...';
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'addData', sheetName: cat, newRowData: newRowData }) });
            
            alert('發佈成功！');
            inputs.forEach(i => i.value = ''); fileInput.value = '';
            
            // 若管理頁面正好顯示該類別，則重新整理清單
            if(document.getElementById('manage-category-select').value === cat) fetchManageList();
        } catch(err) { alert('失敗：'+err); }
        finally { btn.innerText = ogText; btn.disabled = false; }
    });

    // === 管理與編排功能 ===
    const mngSelect = document.getElementById('manage-category-select');
    const mngContainer = document.getElementById('manage-list-container');
    
    const fetchManageList = async () => {
        const cat = mngSelect.value;
        if(!cat) return;
        mngContainer.innerHTML = '讀取中...';
        try {
            const res = await fetch(`${GAS_URL}?sheetName=${cat}`);
            const result = await res.json();
            if(result.data.length <= 1) { mngContainer.innerHTML = '<p>尚無資料</p>'; return; }
            
            let html = '<ul class="data-list">';
            // result.data[0] 是標題列，資料從 index 1 開始。對應到 Google Sheet 列號為 i + 1
            for(let i = 1; i < result.data.length; i++) {
                const title = result.data[i][0] || '未命名項目';
                // HTML 記錄真實的 Sheet 列號 (i + 1)
                html += `
                    <li class="data-item">
                        <div class="data-item-title">${title}</div>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="moveRow('${cat}', ${i+1}, -1)">▲</button>
                            <button class="btn-icon" onclick="moveRow('${cat}', ${i+1}, 1)">▼</button>
                            <button class="btn-icon danger" onclick="deleteRow('${cat}', ${i+1})">刪除</button>
                        </div>
                    </li>`;
            }
            html += '</ul>';
            mngContainer.innerHTML = html;
        } catch(e) { mngContainer.innerHTML = '讀取失敗'; }
    };
    mngSelect.addEventListener('change', fetchManageList);

    // 暴露給全域的方法
    window.deleteRow = async (sheetName, rowIndex) => {
        if(!confirm(`確定要刪除這筆資料嗎？(操作不可逆)`)) return;
        try {
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'deleteRow', sheetName, rowIndex }) });
            fetchManageList(); // 重新整理
        } catch(e) { alert('刪除失敗'); }
    };

    window.moveRow = async (sheetName, rowIndex, direction) => {
        const toIndex = rowIndex + direction;
        if(toIndex <= 1) return; // 不能移到標題列之上
        try {
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'moveRow', sheetName, fromIndex: rowIndex, toIndex }) });
            fetchManageList();
        } catch(e) { alert('移動失敗'); }
    };
});
