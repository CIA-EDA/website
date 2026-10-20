/**
 * 檔案名稱：js/admin.js
 */

const ADMIN_PASSWORD = '6668888';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

const FORM_FIELDS = {
    '課程介紹': [{name:'課程名稱', type:'text'}, {name:'簡介', type:'textarea'}, {name:'講師', type:'text'}, {name:'專屬付款網址', type:'text'}],
    '專業師資': [{name:'講師姓名', type:'text'}, {name:'專長項目', type:'text'}, {name:'個人簡介', type:'textarea'}, {name:'聯絡方式(IG/Line)', type:'text'}],
    '活動花絮': [{name:'活動名稱', type:'text'}, {name:'日期', type:'text'}],
    '關於我們': [{name:'標題', type:'text'}, {name:'內容', type:'textarea'}],
    '品牌推廣': [{name:'產品名稱', type:'text'}, {name:'產品簡介', type:'textarea'}],
    // 新增
    '會員名單': [{name:'帳號(手機或Email)', type:'text'}, {name:'密碼', type:'text'}, {name:'會員姓名', type:'text'}, {name:'權限等級(一般/進階)', type:'text'}],
    '會員專屬影片': [{name:'課程名稱', type:'text'}, {name:'影片嵌入網址(例如YouTube Embed)', type:'text'}, {name:'最低權限要求(一般/進階)', type:'text'}, {name:'課程簡介', type:'textarea'}]
};

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('admin-pwd');
    document.getElementById('btn-login').addEventListener('click', () => {
        if(pwdInput.value === ADMIN_PASSWORD) document.getElementById('login-overlay').style.display = 'none';
        else { alert('Access Denied'); pwdInput.value = ''; }
    });

    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
        });
    });

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
        // 會員名單不需要圖片上傳
        if (cat !== '會員名單') {
            html += `<div class="form-group"><label>上傳圖片/照片/封面 (可選多張)</label><input type="file" id="upload-files" class="input-field" accept="image/*" multiple><div style="font-size:12px; color:#888; margin-top:5px;">圖片將自動上傳並分類至專屬資料夾</div></div>`;
        }
        formContainer.innerHTML = html;
    };
    catSelect.addEventListener('change', renderForm);
    renderForm();

    document.getElementById('btn-submit-data').addEventListener('click', async (e) => {
        const btn = e.target;
        const cat = catSelect.value;
        const inputs = Array.from(formContainer.querySelectorAll('.data-input'));
        
        if(!inputs[0].value.trim()) { alert('請填寫主要名稱/帳號'); return; }

        const ogText = btn.innerText; btn.innerText = '處理中...'; btn.disabled = true;

        try {
            const newRowData = [];
            let imgUrls = '';
            
            if (cat !== '會員名單') {
                const fileInput = document.getElementById('upload-files');
                if(fileInput && fileInput.files.length > 0) {
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
            }

            // 依據 DB_SCHEMA 排列
            if(cat === '課程介紹') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '專業師資') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '活動花絮') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '關於我們') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '品牌推廣') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '會員名單') {
                const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
                newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, timestamp);
            }
            if(cat === '會員專屬影片') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, imgUrls);

            btn.innerText = '寫入資料庫...';
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'addData', sheetName: cat, newRowData: newRowData }) });
            
            alert('發佈成功！');
            inputs.forEach(i => i.value = ''); 
            if(document.getElementById('upload-files')) document.getElementById('upload-files').value = '';
            
            if(document.getElementById('manage-category-select').value === cat) fetchManageList();
        } catch(err) { alert('失敗：'+err); }
        finally { btn.innerText = ogText; btn.disabled = false; }
    });

    // 管理功能保留原有邏輯
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
            for(let i = 1; i < result.data.length; i++) {
                const title = result.data[i][0] || '未命名項目';
                html += `<li class="data-item"><div class="data-item-title">${title}</div><div class="action-btns"><button class="btn-icon" onclick="moveRow('${cat}', ${i+1}, -1)">▲</button><button class="btn-icon" onclick="moveRow('${cat}', ${i+1}, 1)">▼</button><button class="btn-icon danger" onclick="deleteRow('${cat}', ${i+1})">刪除</button></div></li>`;
            }
            html += '</ul>';
            mngContainer.innerHTML = html;
        } catch(e) { mngContainer.innerHTML = '讀取失敗'; }
    };
    mngSelect.addEventListener('change', fetchManageList);

    window.deleteRow = async (sheetName, rowIndex) => {
        if(!confirm(`確定要刪除嗎？`)) return;
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'deleteRow', sheetName, rowIndex }) });
        fetchManageList();
    };
    window.moveRow = async (sheetName, rowIndex, direction) => {
        const toIndex = rowIndex + direction;
        if(toIndex <= 1) return;
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'moveRow', sheetName, fromIndex: rowIndex, toIndex }) });
        fetchManageList();
    };
});
