/**
 * 檔案名稱：js/admin.js
 * 職責：動態表單生成、資料庫列表呈現、刪除與排序操作、會員管理系統 (CRUD)
 */

const ADMIN_PASSWORD = '6668888';
// ⚠️ 請確保填入您最新部署的 GAS 網址
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

const FORM_FIELDS = {
    '課程介紹': [{name:'課程名稱', type:'text'}, {name:'簡介', type:'textarea'}, {name:'講師', type:'text'}, {name:'專屬付款網址', type:'text'}],
    '專業師資': [{name:'講師姓名', type:'text'}, {name:'專長項目', type:'text'}, {name:'個人簡介', type:'textarea'}, {name:'聯絡方式(IG/Line)', type:'text'}],
    '活動花絮': [{name:'活動名稱', type:'text'}, {name:'日期', type:'text'}],
    '關於我們': [{name:'標題', type:'text'}, {name:'內容', type:'textarea'}],
    '品牌推廣': [{name:'產品名稱', type:'text'}, {name:'產品簡介', type:'textarea'}],
    '會員名單': [{name:'帳號(手機或Email)', type:'text'}, {name:'密碼', type:'text'}, {name:'會員姓名', type:'text'}, {name:'權限等級(一般/進階)', type:'text'}],
    '會員專屬影片': [{name:'課程名稱', type:'text'}, {name:'影片嵌入網址(例如YouTube Embed)', type:'text'}, {name:'最低權限要求(一般/進階)', type:'text'}, {name:'課程簡介', type:'textarea'}]
};

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

let allMembersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('admin-pwd');
    document.getElementById('btn-login').addEventListener('click', () => {
        if(pwdInput.value === ADMIN_PASSWORD) {
            document.getElementById('login-overlay').style.display = 'none';
            fetchMembers(); // 登入成功後自動載入會員列表
        } else { alert('Access Denied'); pwdInput.value = ''; }
    });

    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
            
            // 若切換到會員面板，重新整理資料
            if (e.currentTarget.getAttribute('data-target') === 'panel-members') {
                fetchMembers();
            }
        });
    });

    // === 新增：會員管理邏輯 ===
    async function fetchMembers() {
        const container = document.getElementById('members-container');
        container.innerHTML = '<p style="text-align:center; color:#888;">資料載入中...</p>';
        try {
            const res = await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'getAllMembers' })
            });
            const result = await res.json();
            if (result.status === 'success' && result.data.length > 1) {
                allMembersData = result.data;
                renderMembers(allMembersData);
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">目前尚無會員資料。</p>';
            }
        } catch (error) {
            container.innerHTML = '<p style="color:red; text-align:center;">載入失敗</p>';
        }
    }

    function renderMembers(dataToRender) {
        const container = document.getElementById('members-container');
        let html = '';
        
        // 從 i=1 開始跳過標題列
        for (let i = 1; i < dataToRender.length; i++) {
            const m = dataToRender[i];
            const memberId = m[0] || '待設定';
            const account = m[2] || m[1] || '無';
            const level = m[4] || '一般';
            const name = m[5] || '未填寫';
            const phone = m[10] || '未填寫';
            const createTime = m[19] || '';
            const expiryDate = m[20] || '';
            const status = m[22] || '停用';
            const rowIndex = i + 1; // Google Sheet 真實列號
            
            const statusClass = status === '啟用' ? 'status-active' : 'status-inactive';

            html += `
                <div class="member-card">
                    <div class="member-info">
                        <h4>${name} <span class="status-badge ${statusClass}">${status}</span></h4>
                        <p>編號: ${memberId} | 帳號: ${account}</p>
                        <p>電話: ${phone} | 註冊: ${createTime}</p>
                    </div>
                    <div class="member-controls">
                        <div class="control-group">
                            <label>會員編號</label>
                            <input type="text" id="m-id-${rowIndex}" class="input-field" style="padding:8px; width:120px;" value="${memberId}">
                        </div>
                        <div class="control-group">
                            <label>權限等級</label>
                            <select id="m-level-${rowIndex}" class="select-field" style="padding:8px; width:100px;">
                                <option value="一般" ${level==='一般'?'selected':''}>一般</option>
                                <option value="進階" ${level==='進階'?'selected':''}>進階</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>狀態</label>
                            <select id="m-status-${rowIndex}" class="select-field" style="padding:8px; width:100px;">
                                <option value="停用" ${status==='停用'?'selected':''}>停用/待審</option>
                                <option value="啟用" ${status==='啟用'?'selected':''}>啟用</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label>到期日 (YYYY-MM-DD)</label>
                            <input type="date" id="m-exp-${rowIndex}" class="input-field" style="padding:8px; width:140px;" value="${expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : ''}">
                        </div>
                        <div class="control-group" style="justify-content: flex-end;">
                            <button class="btn-primary" onclick="updateMember(${rowIndex})" style="padding:8px 15px;">儲存變更</button>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    // 搜尋功能
    document.getElementById('member-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (!term) { renderMembers(allMembersData); return; }
        
        const filtered = [allMembersData[0]]; // 保留標題
        for (let i = 1; i < allMembersData.length; i++) {
            const rowStr = allMembersData[i].join(' ').toLowerCase();
            if (rowStr.includes(term)) filtered.push(allMembersData[i]);
        }
        renderMembers(filtered);
    });

    // 儲存會員變更的全域函數
    window.updateMember = async (rowIndex) => {
        const memberId = document.getElementById(`m-id-${rowIndex}`).value.trim();
        const level = document.getElementById(`m-level-${rowIndex}`).value;
        const status = document.getElementById(`m-status-${rowIndex}`).value;
        const expiryDate = document.getElementById(`m-exp-${rowIndex}`).value;

        try {
            await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    action: 'updateMemberAdmin',
                    rowIndex: rowIndex,
                    memberId: memberId,
                    level: level,
                    status: status,
                    expiryDate: expiryDate
                })
            });
            alert('會員資料更新成功！前台驗證即刻生效。');
            fetchMembers(); // 刷新列表
        } catch(e) { alert('更新失敗'); }
    };

    // === 以下為原本的動態發佈與管理邏輯 ===
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
                        btn.innerText = `上傳 (${i+1}/${fileInput.files.length})...`;
                        const base64Data = await readFileAsBase64(fileInput.files[i]);
                        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: cat, base64Data: base64Data, mimeType: fileInput.files[i].type, fileName: fileInput.files[i].name }) });
                        const resData = await res.json();
                        if(resData.status === 'success') urls.push(resData.url);
                    }
                    imgUrls = urls.join(',');
                }
            }

            if(cat === '課程介紹') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '專業師資') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '活動花絮') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '關於我們') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '品牌推廣') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '會員名單') {
                const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
                newRowData.push('', '', inputs[0].value, inputs[1].value, inputs[3].value, inputs[2].value, '', '', '', '', '', '', '', '', '', '', '', '', '', timestamp, '', '', '啟用');
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
