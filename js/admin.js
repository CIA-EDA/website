/**
 * 檔案名稱：js/admin.js
 * 職責：動態表單、分頁引擎、內容編輯更新、擴充徵才專區設定
 */

const ADMIN_PASSWORD = '6668888';
// ⚠️ 請確保填入您最新部署的 GAS 網址
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

// === 擴充表單欄位定義 ===
const FORM_FIELDS = {
    '課程介紹': [{name:'課程名稱', type:'text'}, {name:'簡介', type:'textarea'}, {name:'講師', type:'text'}, {name:'專屬付款網址', type:'text'}],
    '專業師資': [{name:'講師姓名', type:'text'}, {name:'專長項目', type:'text'}, {name:'個人簡介', type:'textarea'}, {name:'聯絡方式(IG/Line)', type:'text'}],
    '活動花絮': [{name:'活動名稱', type:'text'}, {name:'日期', type:'text'}],
    '關於我們': [{name:'標題', type:'text'}, {name:'內容', type:'textarea'}],
    '品牌推廣': [{name:'產品名稱', type:'text'}, {name:'產品簡介', type:'textarea'}],
    '徵才專區': [{name:'職缺名稱', type:'text'}, {name:'徵才機構', type:'text'}, {name:'工作地點', type:'text'}, {name:'薪資待遇', type:'text'}, {name:'聯絡方式', type:'text'}, {name:'條件要求', type:'textarea'}],
    '美業資訊交流': [{name:'發文者姓名', type:'text'}, {name:'主旨/標題', type:'text'}, {name:'交流內容', type:'textarea'}],
    '會員專屬影片': [{name:'課程名稱', type:'text'}, {name:'影片嵌入網址(例如YouTube Embed)', type:'text'}, {name:'最低權限要求(一般/進階)', type:'text'}, {name:'課程簡介', type:'textarea'}]
};

const readFileAsBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.readAsDataURL(file); });

let allMembersData = []; 
let currentDisplayData = []; 
let currentManageData = []; 

const ITEMS_PER_PAGE = 20;
let currentPage = 1;

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
        container.innerHTML = '<p style="text-align:center; color:#888;">資料載入中，請稍候...</p>';
        document.getElementById('pagination-controls').style.display = 'none';

        try {
            const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'getAllMembers' }) });
            const result = await res.json();
            if (result.status === 'success' && result.data.length > 1) {
                allMembersData = result.data.slice(1);
                allMembersData = allMembersData.map((row, idx) => ({ data: row, originalIndex: idx + 2 })).reverse();
                
                document.getElementById('total-members-badge').innerText = `總計: ${allMembersData.length} 筆`;
                currentDisplayData = [...allMembersData];
                currentPage = 1;
                renderMembersPage();
            } else {
                container.innerHTML = '<p style="text-align:center; color:#888;">目前尚無會員資料。</p>';
            }
        } catch (error) { container.innerHTML = '<p style="color:red; text-align:center;">載入失敗，請檢查網路連線。</p>'; }
    }

    function renderMembersPage() {
        const container = document.getElementById('members-container');
        const pagination = document.getElementById('pagination-controls');
        
        if (currentDisplayData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">找不到符合條件的會員。</p>';
            pagination.style.display = 'none';
            return;
        }

        const totalPages = Math.ceil(currentDisplayData.length / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageData = currentDisplayData.slice(startIndex, endIndex);

        let html = '';
        pageData.forEach(item => {
            const m = item.data;
            const rowIndex = item.originalIndex; 
            
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
            
            let statusClass = 'status-pending';
            if (status === '啟用') statusClass = 'status-active';
            if (status === '停用') statusClass = 'status-inactive';

            let displayMemberId = memberId;
            if (memberId === '待審核' || memberId === '待設定' || !memberId) {
                let cleanPhone = String(phone).replace(/\D/g, ''); 
                if (cleanPhone) displayMemberId = 'C' + cleanPhone;
            }

            let displayExpiry = expiryDate ? new Date(expiryDate).toISOString().split('T')[0] : '';
            if (!displayExpiry) {
                let nextYear = new Date();
                nextYear.setFullYear(nextYear.getFullYear() + 1); 
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
        });
        
        container.innerHTML = html;
        document.getElementById('page-info').innerText = `第 ${currentPage} 頁 / 共 ${totalPages} 頁 (符合條件：${currentDisplayData.length} 筆)`;
        document.getElementById('btn-prev-page').disabled = currentPage === 1;
        document.getElementById('btn-next-page').disabled = currentPage === totalPages;
        pagination.style.display = totalPages > 1 ? 'flex' : 'none';
    }

    document.getElementById('btn-prev-page').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderMembersPage(); window.scrollTo(0, 0); } });
    document.getElementById('btn-next-page').addEventListener('click', () => { const totalPages = Math.ceil(currentDisplayData.length / ITEMS_PER_PAGE); if (currentPage < totalPages) { currentPage++; renderMembersPage(); window.scrollTo(0, 0); } });

    document.getElementById('member-search').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        if (!term) { 
            currentDisplayData = [...allMembersData]; 
        } else {
            currentDisplayData = allMembersData.filter(item => item.data.join(' ').toLowerCase().includes(term));
        }
        currentPage = 1;
        renderMembersPage();
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
        html += `<div class="form-group"><label>上傳圖片/照片/公司Logo (可選多張)</label><input type="file" id="upload-files" class="input-field" accept="image/*" multiple></div>`;
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
            if(cat === '徵才專區') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, inputs[5].value, inputs[4].value, imgUrls, new Date().toISOString().split('T')[0]);
            if(cat === '會員專屬影片') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, imgUrls);

            btn.innerText = '寫入資料庫...';
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'addData', sheetName: cat, newRowData: newRowData }) });
            alert('發佈成功！'); inputs.forEach(i => i.value = ''); if(document.getElementById('upload-files')) document.getElementById('upload-files').value = '';
            
            if(document.getElementById('manage-category-select').value === cat) document.getElementById('manage-category-select').dispatchEvent(new Event('change'));
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
            
            currentManageData = result.data; 
            
            let html = '<ul class="data-list">';
            for(let i = 1; i < result.data.length; i++) {
                const title = result.data[i][0] || result.data[i][2] || '未命名項目'; // 支援交流標題
                html += `
                    <li class="data-item">
                        <div class="data-item-title">${title}</div>
                        <div class="action-btns">
                            <button class="btn-icon" onclick="openEditModal('${cat}', ${i+1})">編輯</button>
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

    window.deleteRow = async (sheetName, rowIndex) => {
        if(!confirm(`確定要刪除嗎？`)) return;
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'deleteRow', sheetName, rowIndex }) }); fetchManageList();
    };
    window.moveRow = async (sheetName, rowIndex, direction) => {
        const toIndex = rowIndex + direction;
        if(toIndex <= 1) return;
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'moveRow', sheetName, fromIndex: rowIndex, toIndex }) }); fetchManageList();
    };

    window.openEditModal = (sheetName, rowIndex) => {
        const dataRow = currentManageData[rowIndex - 1]; 
        const fields = FORM_FIELDS[sheetName];
        const formContainer = document.getElementById('edit-dynamic-form-container');
        let html = '';

        fields.forEach((f, idx) => {
            const val = dataRow[idx] || '';
            if(f.type === 'textarea') {
                html += `<div class="form-group"><label>${f.name}</label><textarea class="textarea-field edit-data-input" data-name="${f.name}">${val}</textarea></div>`;
            } else {
                html += `<div class="form-group"><label>${f.name}</label><input type="text" class="input-field edit-data-input" data-name="${f.name}" value="${val}"></div>`;
            }
        });

        let oldImg = '';
        if (sheetName === '課程介紹' || sheetName === '專業師資') oldImg = dataRow[3];
        else if (sheetName === '活動花絮' || sheetName === '關於我們' || sheetName === '品牌推廣') oldImg = dataRow[2];
        else if (sheetName === '徵才專區') oldImg = dataRow[6];
        else if (sheetName === '美業資訊交流') oldImg = dataRow[4];
        else if (sheetName === '會員專屬影片') oldImg = dataRow[4];

        document.getElementById('edit-old-images').value = oldImg || '';

        html += `
            <div class="form-group">
                <label>上傳新圖片 <span style="color:#B8955A; font-weight:normal;">(若不更改，請留空)</span></label>
                <input type="file" id="edit-upload-files" class="input-field" accept="image/*" multiple>
            </div>`;
        if (oldImg) html += `<div style="font-size:12px; color:#B8955A; margin-bottom: 20px;">✓ 系統內已存有該項目的圖片。</div>`;

        formContainer.innerHTML = html;
        document.getElementById('edit-row-index').value = rowIndex;
        document.getElementById('edit-sheet-name').value = sheetName;
        
        document.getElementById('edit-content-modal').classList.add('active');
    };

    document.getElementById('btn-save-edit').addEventListener('click', async (e) => {
        const btn = e.target;
        const sheetName = document.getElementById('edit-sheet-name').value;
        const rowIndex = document.getElementById('edit-row-index').value;
        const inputs = Array.from(document.querySelectorAll('.edit-data-input'));

        if(!inputs[0].value.trim()) { alert('請填寫主要名稱/標題'); return; }
        btn.innerText = '處理中...'; btn.disabled = true;

        try {
            let imgUrls = document.getElementById('edit-old-images').value;
            const fileInput = document.getElementById('edit-upload-files');

            if(fileInput && fileInput.files.length > 0) {
                const urls = [];
                for(let i=0; i<fileInput.files.length; i++) {
                    btn.innerText = `上傳新圖 (${i+1}/${fileInput.files.length})...`;
                    const base64Data = await readFileAsBase64(fileInput.files[i]);
                    const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: sheetName, base64Data: base64Data, mimeType: fileInput.files[i].type, fileName: fileInput.files[i].name }) });
                    const resData = await res.json();
                    if(resData.status === 'success') urls.push(resData.url);
                }
                imgUrls = urls.join(','); 
            }

            const newRowData = [];
            if(sheetName === '課程介紹') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(sheetName === '專業師資') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, imgUrls, inputs[3].value);
            if(sheetName === '活動花絮') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(sheetName === '關於我們') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(sheetName === '品牌推廣') newRowData.push(inputs[0].value, inputs[1].value, imgUrls);
            if(sheetName === '徵才專區') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, inputs[5].value, inputs[4].value, imgUrls, new Date().toISOString().split('T')[0]);
            if(sheetName === '美業資訊交流') newRowData.push(inputs[0].value, new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }), inputs[1].value, inputs[2].value, imgUrls);
            if(sheetName === '會員專屬影片') newRowData.push(inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, imgUrls);

            btn.innerText = '寫入資料庫...';
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'updateContentRow', sheetName: sheetName, rowIndex: rowIndex, newRowData: newRowData }) });

            alert('內容修改成功！');
            document.getElementById('edit-content-modal').classList.remove('active');
            fetchManageList(); 
        } catch(err) { alert('失敗：'+err); }
        finally { btn.innerText = '儲存變更'; btn.disabled = false; }
    });
});
