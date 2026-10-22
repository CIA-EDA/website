/**
 * 檔案名稱：js/admin.js
 * 職責：動態表單生成、會員管理系統 (加入自動生成 C+手機號碼 與 預設一年到期日)
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
    '會員專屬影片': [{name:'課程名稱', type:'text'}, {name:'影片嵌入網址(例如YouTube Embed)', type:'text'}, {name:'最低權限要求(一般/進階)', type:'text'}, {name:'課程簡介', type:'textarea'}]
};

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

let allMembersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const pwdInput = document.getElementById('admin-pwd');
    document.getElementById('btn-login').addEventListener('click', () => {
        if(pwdInput.value === ADMIN_PASSWORD) {
            document.getElementById('login-overlay').style.display = 'none';
            fetchMembers(); 
        } else { alert('Access Denied'); pwdInput.value = ''; }
    });

    document.querySelectorAll('.nav-item[data-target]').forEach(item => {
        item.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.getElementById(e.currentTarget.getAttribute('data-target')).classList.add('active');
            if (e.currentTarget.getAttribute('data-target') === 'panel-members') fetchMembers();
        });
    });

    async function fetchMembers() {
        const container = document.getElementById('members-container');
        container.innerHTML = '<p style="text-align:center; color:#888;">資料載入中...</p>';
        try {
            const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'getAllMembers' }) });
            const result = await res.json();
            if (result.status === 'success' && result.data.length > 1) {
                allMembersData = result.data;
                renderMembers(allMembersData);
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">目前尚無會員資料。</p>';
            }
        } catch (error) { container.innerHTML = '<p style="color:red; text-align:center;">載入失敗</p>'; }
    }

    function renderMembers(dataToRender) {
        const container = document.getElementById('members-container');
        let html = '';
        
        for (let i = 1; i < dataToRender.length; i++) {
            const m = dataToRender[i];
            const memberId = m[0] || '待審核';
            const account = m[2] || m[1] || '無';
            const level = m[4] || '一般';
            const name = m[5] || '未填寫';
            const enName = m[6] || '無';
            const gender = m[7] || '未知';
            const birth = m[8] || '';
            const idNum = m[9] || '無';
            
            let phone = m[10] || '未填寫';
            phone = String(phone).replace(/^'/, ''); 
            if (phone.startsWith('9') && phone.length === 9) phone = '0' + phone; 
            
            const lineId = m[11] || '無';
            const email = m[12] || '無';
            const address = m[13] || '無';
            const edu = m[14] || '無';
            const fields = m[15] || '無';
            const company = m[16] || '無';
            const jobTitle = m[17] || '無';
            const memType = m[18] || '無';
            const createTime = m[19] || '';
            const expiryDate = m[20] || '';
            const status = m[22] || '待審核';
            const rowIndex = i + 1; 
            
            let statusClass = 'status-pending';
            if (status === '啟用') statusClass = 'status-active';
            if (status === '停用') statusClass = 'status-inactive';

            // === 核心邏輯：自動計算預設值 ===
            let displayMemberId = memberId;
            if (memberId === '待審核' || memberId === '待設定' || !memberId) {
                let cleanPhone = String(phone).replace(/\D/g, ''); // 只保留數字
                if (cleanPhone) displayMemberId = 'C' + cleanPhone;
            }

            let displayExpiry = expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : '';
            if (!displayExpiry) {
                let nextYear = new Date();
                nextYear.setFullYear(nextYear.getFullYear() + 1); // 自動往後推一年
                displayExpiry = nextYear.toISOString().split('T')[0];
            }

            html += `
                <div class="member-card">
                    <div class="member-card-header">
                        <div class="member-info">
                            <h4>${name} <span class="status-badge ${statusClass}">${status}</span></h4>
                            <p>編號: ${memberId} | 帳號: ${account}</p>
                            <p>電話: ${phone} | 註冊: ${createTime}</p>
                        </div>
                        <div class="member-controls">
                            <div class="control-group">
                                <label>會員編號</label>
                                <input type="text" id="m-id-${rowIndex}" class="input-field" style="padding:8px; width:120px;" value="${displayMemberId}">
                            </div>
                            <div class="control-group">
                                <label>權限等級</label>
                                <select id="m-level-${rowIndex}" class="select-field">
                                    <option value="一般" ${level==='一般'?'selected':''}>一般</option>
                                    <option value="進階" ${level==='進階'?'selected':''}>進階</option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label>狀態</label>
                                <select id="m-status-${rowIndex}" class="select-field">
                                    <option value="待審核" ${status==='待審核'?'selected':''}>待審核</option>
                                    <option value="啟用" ${status==='啟用'?'selected':''}>啟用</option>
                                    <option value="停用" ${status==='停用'?'selected':''}>停用</option>
                                </select>
                            </div>
                            <div class="control-group">
                                <label>到期日 (預設1年)</label>
                                <input type="date" id="m-exp-${rowIndex}" class="input-field" value="${displayExpiry}">
                            </div>
                            <div class="control-group">
                                <button class="btn-primary" onclick="updateMember(${rowIndex})">儲存變更</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="details-box">
                        <div><span>英文姓名:</span> ${enName}</div>
                        <div><span>性別/生日:</span> ${gender} | ${birth ? new Date(birth).toISOString().split('T')[0] : ''}</div>
                        <div><span>身分證號:</span> ${idNum}</div>
                        <div><span>LINE ID:</span> ${lineId}</div>
                        <div><span>電子郵件:</span> ${email}</div>
                        <div><span>最高學歷:</span> ${edu}</div>
                        <div><span>申請會籍:</span> ${memType}</div>
                        <div style="grid-column: 1 / -1;"><span>專業領域:</span> ${fields}</div>
                        <div style="grid-column: 1 / -1;"><span>現職機構:</span> ${company} ${jobTitle ? `(${jobTitle})` : ''}</div>
                        <div style="grid-column: 1 / -1;"><span>通訊地址:</span> ${address}</div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    }

    document.getElementById('member-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (!term) { renderMembers(allMembersData); return; }
        const filtered = [allMembersData[0]]; 
        for (let i = 1; i < allMembersData.length; i++) {
            const rowStr = allMembersData[i].join(' ').toLowerCase();
            if (rowStr.includes(term)) filtered.push(allMembersData[i]);
        }
        renderMembers(filtered);
    });

    window.updateMember = async (rowIndex) => {
        const memberId = document.getElementById(`m-id-${rowIndex}`).value.trim();
        const level = document.getElementById(`m-level-${rowIndex}`).value;
        const status = document.getElementById(`m-status-${rowIndex}`).value;
        const expiryDate = document.getElementById(`m-exp-${rowIndex}`).value;
        try {
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'updateMemberAdmin', rowIndex: rowIndex, memberId: memberId, level: level, status: status, expiryDate: expiryDate }) });
            alert('會員資料更新成功！'); fetchMembers(); 
        } catch(e) { alert('更新失敗'); }
    };

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
        html += `<div class="form-group"><label>上傳圖片/照片/封面 (可選多張)</label><input type="file" id="upload-files" class="input-field" accept="image/*" multiple><div style="font-size:12px; color:#888; margin-top:5px;">圖片將自動上傳並分類至專屬資料夾</div></div>`;
        formContainer.innerHTML = html;
    };
    catSelect.addEventListener('change', renderForm); renderForm();

    document.getElementById('btn-submit-data').addEventListener('click', async (e) => {
        const btn = e.target;
        const cat = catSelect.value;
        const inputs = Array.from(formContainer.querySelectorAll('.data-input'));
        if(!inputs[0].value.trim()) { alert('請填寫主要名稱/標題'); return; }
        const ogText = btn.innerText; btn.innerText = '處理中...'; btn.disabled = true;

        try {
            const newRowData = [];
            let imgUrls = '';
            
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

            if(cat === '課程介紹') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '專業師資') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(cat === '活動花絮') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '關於我們') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '品牌推廣') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(cat === '會員專屬影片') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, imgUrls);

            btn.innerText = '寫入資料庫...';
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'addData', sheetName: cat, newRowData: newRowData }) });
            alert('發佈成功！'); inputs.forEach(i => i.value = ''); if(document.getElementById('upload-files')) document.getElementById('upload-files').value = '';
        } catch(err) { alert('失敗：'+err); } finally { btn.innerText = ogText; btn.disabled = false; }
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
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'deleteRow', sheetName, rowIndex }) }); fetchManageList();
    };
    window.moveRow = async (sheetName, rowIndex, direction) => {
        const toIndex = rowIndex + direction;
        if(toIndex <= 1) return;
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'moveRow', sheetName, fromIndex: rowIndex, toIndex }) }); fetchManageList();
    };
});
