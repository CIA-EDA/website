/**
 * 檔案名稱：js/app.js
 * 職責：事件綁定中心、各類彈窗邏輯與表單送出
 */

document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu(); 
    setupMemberLogin(); 
    updateMemberUI();
    setupProfileCompletionForm(); 
    setupEditProfileForm();
    setupContactModal(); 
    setupPostModal(); 
    
    window.addEventListener('hashchange', () => { 
        handlePageTransition(); 
        loadPage(); 
    });
    
    window.addEventListener('beforeunload', () => { 
        handlePageTransition(); 
    });
    
    initSystem(); 
});

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) {
        mobileBtn.addEventListener('click', () => {
            mainNav.classList.toggle('show');
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('mobile-active'));
        });
        
        mainNav.querySelectorAll('a:not(.dropdown-toggle)').forEach(link => { 
            link.addEventListener('click', () => mainNav.classList.remove('show')); 
        });
        
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            dropdown.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('mobile-active'); });
                    dropdown.classList.toggle('mobile-active');
                }
            });
        });
    }
}

window.openDetailModal = function(index) {
    const item = currentViewDataCache[index];
    if (!item) return;

    const title = item['課程名稱'] || item['講師姓名'] || item['顧問姓名'] || item['店家名稱'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
    let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || item['交流內容'] || '';
    const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || item['封面圖片網址'] || '';
    const linkRaw = item['報名連結'] || item['專屬付款網址'] || item['連結'] || item['專屬報名網址'] || item['相關連結'] || ''; 

    let extraHtml = '';
    if (item['發佈日期'] && item['相關連結']) return; 
    
    if (item['徵才機構']) desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
    else if (item['發文者姓名']) extraHtml = `<div style="font-size:12px; color:var(--champagne); margin-top:10px; text-align:center;">${item['發文者姓名']} • ${item['發文時間']}</div>`;
    else if (item['專長項目']) desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
    else if (item['店家名稱']) desc = `👤 負責人：${item['負責人']}\n📍 地址：${item['地址']}\n📞 電話：${item['聯絡電話']}\n\n${item['簡介']}`;

    let imagesHtml = '';
    const rawUrls = imgRaw.split(',').map(u => u.trim()).filter(u => u);
    if (rawUrls.length > 0) {
        rawUrls.forEach(url => {
            imagesHtml += `<img src="${optimizeImageUrl(url)}" style="width: 100%; display: block; border-bottom: 1px solid #eee;">`;
        });
    }

    let actionHtml = linkRaw ? `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="font-size: 18px; padding: 12px 30px;">💳 了解更多 / 報名</a>` : '';
    if (item['最低權限要求(例如:一般會員)'] !== undefined) {
        const reqLevel = item['最低權限要求(例如:一般會員)'] || '會員';
        actionHtml = `<button class="candy-btn member-btn" style="width:100%; font-size:18px; padding: 12px 30px;" onclick="playCourseVideo(event, '${title}', '${reqLevel}')">▶️ 播放線上課程 (${reqLevel}專屬)</button>`;
    }

    document.getElementById('detail-modal-images').innerHTML = imagesHtml;
    document.getElementById('detail-modal-title').innerText = title;
    document.getElementById('detail-modal-desc').innerHTML = desc.replace(/\n/g, '<br>') + extraHtml;
    document.getElementById('detail-modal-action').innerHTML = actionHtml;

    document.getElementById('detail-modal').classList.add('active');
};

window.playCourseVideo = async function(event, courseTitle, reqLevel) {
    event.stopPropagation();
    if (!isAuthValid()) { alert('請先登入會員！'); window.location.hash = '#member-zone'; return; }
    
    const credentials = getSafeCredentials();
    const memberInfo = getSafeMemberInfo();
    
    if (!credentials || !memberInfo) { alert('請先登入會員！'); window.location.hash = '#member-zone'; return; }
    if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') { alert(`您的狀態為【${memberInfo.memberStatus}】，無法觀看。`); return; }
    
    const btn = event.target; const ogText = btn.innerText;
    btn.innerText = '驗證專屬權限中...'; btn.disabled = true;

    try {
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'verifyAndGetCourses', credentials: credentials }) });
        const data = await res.json();
        if (data.status === 'success') {
            const courses = data.data.slice(1);
            const course = courses.find(c => c[0] === courseTitle);
            if (course && course[1]) {
                document.getElementById('video-player-container').innerHTML = `<iframe src="${course[1]}" allowfullscreen></iframe>`;
                document.getElementById('video-modal').classList.add('active');
            } else { alert(`權限不足或找不到該課程影片。此課程需為【${reqLevel}】。`); }
        } else { alert(data.message || '驗證失敗'); }
    } catch(e) { alert('連線失敗，請稍後再試。'); } 
    finally { btn.innerText = ogText; btn.disabled = false; }
}

function setupContactModal() {
    const contactModal = document.getElementById('contact-modal');
    const openContactBtn = document.getElementById('open-contact-btn');
    const closeContactBtn = document.getElementById('close-contact-btn');
    if(openContactBtn) openContactBtn.addEventListener('click', () => contactModal.classList.add('active'));
    if(closeContactBtn) closeContactBtn.addEventListener('click', () => contactModal.classList.remove('active'));
    
    const detailModal = document.getElementById('detail-modal');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    if(closeDetailBtn) closeDetailBtn.addEventListener('click', () => detailModal.classList.remove('active'));

    window.addEventListener('click', (e) => { 
        if (e.target === contactModal) contactModal.classList.remove('active'); 
        if (e.target === detailModal) detailModal.classList.remove('active');
    });

    const submitBtn = document.getElementById('submit-contact-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const name = document.getElementById('c-name').value.trim();
            const phone = document.getElementById('c-phone').value.trim();
            const line = document.getElementById('c-line').value.trim();
            const subject = document.getElementById('c-subject').value.trim();
            const msg = document.getElementById('c-message').value.trim();
            if (!name || !phone || !subject || !msg) { alert('請填寫所有必填欄位！'); return; }
            submitBtn.innerText = '傳送中...'; submitBtn.disabled = true;
            try {
                const timestamp = getCleanTime();
                await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, sheetName: '聯絡我們', newRowData: [timestamp, name, phone, line, subject, msg], action: 'submitContact' }) });
                alert('訊息已成功送出！'); contactModal.classList.remove('active');
                ['c-name', 'c-phone', 'c-line', 'c-subject', 'c-message'].forEach(id => document.getElementById(id).value = '');
            } catch (err) { alert('失敗請稍後重試'); } 
            finally { submitBtn.innerText = '確認送出'; submitBtn.disabled = false; }
        });
    }
}

window.submitComment = async function(event, index, postTitle, postTime) {
    if(event) event.stopPropagation(); 
    const input = document.getElementById(`comment-input-${index}`);
    const content = input.value.trim();
    if (!content) { alert('請輸入留言內容！'); return; }

    const credentials = getSafeCredentials();
    const memberInfo = getSafeMemberInfo();
    if (!credentials || !memberInfo) { alert('請先登入會員才能留言！'); return; }

    const btn = event.target; const ogText = btn.innerText;
    btn.innerText = '傳送中...'; btn.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'submitComment', lineUid: credentials.lineUid, postTitle: postTitle, postTime: postTime, content: content })
        });
        alert('留言成功！'); input.value = ''; await loadPage(); 
    } catch(e) { alert('留言失敗，請稍後再試。'); } 
    finally { btn.innerText = ogText; btn.disabled = false; }
};

function setupPostModal() {
    const postModal = document.getElementById('post-modal');
    const closePostBtn = document.getElementById('close-post-btn');
    const submitPostBtn = document.getElementById('submit-post-btn');
    
    if(closePostBtn) closePostBtn.addEventListener('click', () => postModal.classList.remove('active'));
    window.addEventListener('click', (e) => { if (e.target === postModal) postModal.classList.remove('active'); });

    if (submitPostBtn) {
        submitPostBtn.addEventListener('click', async () => {
            const title = document.getElementById('post-title').value.trim();
            const content = document.getElementById('post-content').value.trim();
            const fileInput = document.getElementById('post-image');

            if (!title || !content) { alert('請填寫標題與內容！'); return; }

            let base64Data = null; let mimeType = null; let fileName = null;
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) { alert('照片超過 5MB 上限！'); return; }
                base64Data = await readFileAsBase64(file);
                mimeType = file.type; fileName = file.name;
            }

            submitPostBtn.innerText = '發佈中...'; submitPostBtn.disabled = true;
            try {
                const credentials = getSafeCredentials();
                let imgUrl = '';
                if (base64Data) {
                    submitPostBtn.innerText = '上傳圖片中...';
                    const resImg = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: '美業資訊交流', base64Data: base64Data, mimeType: mimeType, fileName: fileName }) });
                    const imgData = await resImg.json();
                    if (imgData.status === 'success') imgUrl = imgData.url;
                }

                submitPostBtn.innerText = '寫入資料庫...';
                await fetch(GAS_URL, { 
                    method: 'POST', 
                    body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'userPostExchange', lineUid: credentials.lineUid, postTitle: title, postContent: content, imgUrl: imgUrl }) 
                });
                
                alert('發佈成功！'); postModal.classList.remove('active');
                document.getElementById('post-title').value = ''; document.getElementById('post-content').value = ''; fileInput.value = '';
                
                sessionStorage.removeItem('cia_cache_美業資訊交流'); loadPage();
            } catch(e) { alert('發佈失敗：' + e.message); } 
            finally { submitPostBtn.innerText = '確認發佈'; submitPostBtn.disabled = false; }
        });
    }
}

function setupProfileCompletionForm() {
    const submitBtn = document.getElementById('submit-profile-btn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', async () => {
        const profileData = {
            nameZh: document.getElementById('p-name-zh').value.trim(), nameEn: document.getElementById('p-name-en').value.trim(),
            gender: document.getElementById('p-gender').value, birth: document.getElementById('p-birth').value,
            idNum: document.getElementById('p-id').value.trim(), phone: document.getElementById('p-phone').value.trim(),
            line: document.getElementById('p-line').value.trim(), email: document.getElementById('p-email').value.trim(),
            address: document.getElementById('p-address').value.trim(), edu: document.getElementById('p-edu').value,
            fields: document.getElementById('p-fields').value.trim(), company: document.getElementById('p-company').value.trim(),
            jobTitle: document.getElementById('p-jobtitle').value.trim(), membership: document.getElementById('p-membership').value
        };

        if (!profileData.nameZh || !profileData.birth || !profileData.idNum || !profileData.phone || !profileData.email) {
            alert('請填寫所有標示星號 (*) 的必填欄位！'); return;
        }

        submitBtn.innerText = '送出審核中...'; submitBtn.disabled = true;
        try {
            const credentials = getSafeCredentials();
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'updateMemberProfile', lineUid: credentials.lineUid, profileData: profileData }) });
            alert('入會申請送出成功！\n\n請前往「官方 LINE」聯繫客服人員，我們提供【現金 / 轉帳 / 刷卡】服務。\n繳費並經管理員審核通過後，即可為您開通會員權限！');
            
            let memberInfo = getSafeMemberInfo();
            memberInfo.needsProfileCompletion = false; memberInfo.name = profileData.nameZh; memberInfo.memberStatus = '待審核';
            localStorage.setItem('cia_member_info', JSON.stringify(memberInfo));
            window.location.hash = '#member-zone';
        } catch(e) { alert('儲存失敗，請稍後再試。'); } 
        finally { submitBtn.innerText = '確認送出申請'; submitBtn.disabled = false; }
    });
}

function setupEditProfileForm() {
    const submitBtn = document.getElementById('submit-edit-profile-btn');
    if (!submitBtn) return;
    submitBtn.addEventListener('click', async () => {
        const profileData = {
            nameZh: document.getElementById('e-name-zh').value.trim(), nameEn: document.getElementById('e-name-en').value.trim(),
            gender: document.getElementById('e-gender').value, birth: document.getElementById('e-birth').value,
            idNum: document.getElementById('e-id').value.trim(), phone: document.getElementById('e-phone').value.trim(),
            line: document.getElementById('e-line').value.trim(), email: document.getElementById('e-email').value.trim(),
            address: document.getElementById('e-address').value.trim(), edu: document.getElementById('e-edu').value,
            fields: document.getElementById('e-fields').value.trim(), company: document.getElementById('e-company').value.trim(),
            jobTitle: document.getElementById('e-jobtitle').value.trim()
        };

        submitBtn.innerText = '更新資料中...'; submitBtn.disabled = true;
        try {
            const credentials = getSafeCredentials();
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'editMemberProfile', lineUid: credentials.lineUid, profileData: profileData }) });
            
            let memberInfo = getSafeMemberInfo();
            Object.assign(memberInfo, {
                nameEn: profileData.nameEn, gender: profileData.gender, birth: profileData.birth, idNum: profileData.idNum, 
                phone: profileData.phone, lineId: profileData.line, email: profileData.email, address: profileData.address,
                edu: profileData.edu, fields: profileData.fields, company: profileData.company, jobTitle: profileData.jobTitle
            });
            localStorage.setItem('cia_member_info', JSON.stringify(memberInfo));
            
            alert('個人資料更新成功！'); window.location.hash = '#member-zone';
        } catch(e) { alert('更新失敗'); } 
        finally { submitBtn.innerText = '儲存變更'; submitBtn.disabled = false; }
    });
}
