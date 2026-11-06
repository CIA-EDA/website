/**
 * 檔案名稱：js/liff.js
 * 職責：統一 4 欄網格排版、專屬 LINE 大廳全自動登入 (加入強制防呆機制)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const LIFF_ID_MEMBER = '2012121201-JKa4hPdF'; 

let currentTab = 'dashboard';
window.currentCommentsCache = []; 

function showPreloader() { document.getElementById('preloader').style.display = 'flex'; }
function hidePreloader() { document.getElementById('preloader').style.display = 'none'; }

function setHeader(title) { document.getElementById('app-title').innerText = title; }

function showView(viewId) {
    document.querySelectorAll('.view-panel').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + viewId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const activeNav = document.querySelector(`.nav-item[data-target="${viewId}"]`);
    if (activeNav) activeNav.classList.add('active');
    
    document.getElementById('fab-post').style.display = (viewId === 'exchange') ? 'flex' : 'none';
    document.querySelector('.app-main').scrollTo(0,0);
}

async function switchNav(target) {
    currentTab = target;
    if (target === 'dashboard') { setHeader('會員中心'); showView('dashboard'); }
    else if (target === 'profile') { 
        setHeader('我的會員資訊'); fillProfileForm(); showView('profile'); 
    }
    else if (target === 'post') {
         setHeader('我要發文'); showView('post');
    }
    else {
        let sheetName = '';
        if(target === 'courses') { sheetName = '會員專屬影片'; setHeader('線上課程平台'); }
        if(target === 'courses-all') { sheetName = '課程介紹'; setHeader('課程總覽'); } 
        if(target === 'news') { sheetName = '最新消息'; setHeader('最新消息'); } 
        if(target === 'exchange') { sheetName = '美業資訊交流'; setHeader('美業資訊交流'); }
        if(target === 'jobs') { sheetName = '徵才專區'; setHeader('徵才專區'); }
        if(target === 'brands') { sheetName = '品牌推廣'; setHeader('品牌推廣與合作'); } 
        
        showView('list');
        await loadListData(sheetName);
    }
}

function initApp() {
    showPreloader();
    
    // 終極防呆：2.5 秒後一定解鎖
    setTimeout(hidePreloader, 2500);
    
    try {
        if (typeof liff !== 'undefined') {
            liff.init({ liffId: LIFF_ID_MEMBER }).then(() => {
                if (liff.isLoggedIn()) {
                    processLogin(true);
                } else {
                    liff.login({ redirectUri: window.location.href }); 
                }
            }).catch((err) => {
                console.error(err);
                hidePreloader();
            });
        } else {
            hidePreloader();
        }
    } catch (err) { 
        console.error(err);
        hidePreloader(); 
    }
}

async function triggerLineLogin() {
    if (!liff.isLoggedIn()) liff.login({ redirectUri: window.location.href });
    else await processLogin();
}

async function processLogin(isSilent = false) {
    if(!isSilent) showPreloader();
    try {
        const profile = await liff.getProfile();
        const res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'lineLogin', lineUid: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl }) });
        const data = await res.json();
        
        if (data.status === 'success') {
            localStorage.setItem('cia_member_credentials', JSON.stringify({ lineUid: profile.userId }));
            localStorage.setItem('cia_member_info', JSON.stringify(data.member));
            checkMemberState(data.member);
        } else {
            alert('登入失敗：' + data.message);
            showView('login');
        }
    } catch(e) { 
        console.error(e);
        showView('login'); 
    } finally { 
        hidePreloader(); 
    }
}

function checkMemberState(member) {
    if (member.needsProfileCompletion) {
        document.getElementById('r-name').value = member.name || '';
        setHeader('建立資料');
        showView('register');
    } else if (member.memberStatus === '停用' || member.memberStatus === '待審核') {
        setHeader('審核中');
        showView('pending');
    } else {
        document.getElementById('bottom-nav').style.display = 'flex';
        document.getElementById('dash-avatar').src = member.avatar || 'https://via.placeholder.com/60';
        document.getElementById('dash-name').innerText = member.name;
        document.getElementById('dash-level').innerText = member.level;
        
        const expiry = member.expiryDate ? new Date(member.expiryDate).toISOString().split('T')[0] : '無';
        document.getElementById('dash-expiry').innerText = `到期日: ${expiry}`;

        loadDashboardNews();
        switchNav('dashboard');
    }
}

async function loadDashboardNews() {
    const container = document.getElementById('dash-news-container');
    try {
        const res = await fetch(`${GAS_URL}?sheetName=最新消息`);
        const dataObj = await res.json();
        if (dataObj.status === 'success' && dataObj.data.length > 1) {
            let newsData = dataObj.data.slice(1).reverse().slice(0, 2); 
            if (newsData.length > 0) {
                let html = '';
                newsData.forEach(item => {
                    const date = item[0] || '';
                    const title = item[1] || '無標題';
                    html += `
                        <div class="dash-news-item" onclick="switchNav('news')">
                            <div class="dash-news-date">${date}</div>
                            <div class="dash-news-title">${title}</div>
                        </div>
                    `;
                });
                container.innerHTML = html;
                return;
            }
        }
        container.innerHTML = '<div style="grid-column: span 2; text-align: center; color: #aaa; font-size: 12px; padding: 10px;">目前尚無最新消息</div>';
    } catch(e) {
        container.innerHTML = '<div style="grid-column: span 2; text-align: center; color: red; font-size: 12px; padding: 10px;">無法取得最新消息</div>';
    }
}

function logout() {
    localStorage.removeItem('cia_member_credentials');
    localStorage.removeItem('cia_member_info');
    if(liff.isLoggedIn()) liff.logout();
    document.getElementById('bottom-nav').style.display = 'none';
    document.getElementById('fab-post').style.display = 'none';
    setHeader('會員中心');
    showView('login');
}

async function loadListData(sheetName) {
    const container = document.getElementById('list-container');
    container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--app-gold); font-weight:bold;">載入中...</div>';
    try {
        const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
        let res;
        if (sheetName === '會員專屬影片') {
             res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'verifyAndGetCourses', credentials: credentials }) });
        } else {
             res = await fetch(`${GAS_URL}?sheetName=${sheetName}`);
        }
        
        const dataObj = await res.json();

        if (sheetName === '美業資訊交流') {
            const commentsRes = await fetch(`${GAS_URL}?sheetName=交流留言`);
            const commentsData = await commentsRes.json();
            if (commentsData.status === 'success' && commentsData.data.length > 1) {
                window.currentCommentsCache = commentsData.data.slice(1);
            } else {
                window.currentCommentsCache = [];
            }
        }
        
        if (dataObj.status === 'success' && dataObj.data.length > 1) {
            let dataArray = dataObj.data;
            const headers = dataArray.shift();
            
            if (sheetName === '美業資訊交流' || sheetName === '徵才專區' || sheetName === '最新消息') dataArray = dataArray.reverse();
            
            // ★ 使用與網頁版相同的 .responsive-grid
            let html = '<div class="responsive-grid">';
            
            dataArray.forEach((row, idx) => {
                let item = {};
                headers.forEach((h, i) => item[h] = row[i]);
                
                const title = item['職缺名稱'] || item['主旨/標題'] || item['課程名稱'] || item['標題'] || item['產品名稱'] || '無標題';
                let desc = item['交流內容'] || item['課程簡介'] || item['內容'] || '';
                let extra = '';
                let imgUrl = item['公司Logo或環境照片'] || item['附圖網址'] || item['封面圖片網址'] || item['圖片網址'] || item['產品logo及圖檔'] || '';
                let linkUrl = item['專屬付款網址'] || item['連結'] || item['專屬報名網址'] || item['相關連結'] || '';
                
                if (sheetName === '品牌推廣') {
                    if (imgUrl) {
                        const optimizedUrl = imgUrl.split(',')[0].trim();
                        html += `
                            <a href="${linkUrl || '#'}" target="${linkUrl ? '_blank' : '_self'}" style="display:block; border-radius:16px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); transition:0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                                <img src="${optimizedUrl}" alt="${title}" style="width:100%; height:auto; display:block; object-fit:cover;">
                            </a>
                        `;
                    }
                    return; 
                }

                if (sheetName === '徵才專區') {
                    desc = `機構：${item['徵才機構']}<br>地點：${item['工作地點']}<br>薪資：${item['薪資待遇']}<br>聯絡：${item['聯絡方式']}`;
                } else if (sheetName === '美業資訊交流') {
                    extra = `<div style="font-size:12px; color:var(--app-gold); margin-top:10px;">${item['發文者姓名']} • ${item['發文時間']}</div>`;
                    extra += buildCommentsHtml(title, item['發文時間'], idx);
                } else if (sheetName === '最新消息') {
                    extra = `<div style="font-size:12px; color:var(--app-gold); margin-bottom:5px; font-weight:bold;">發佈日期：${item['發佈日期']}</div>`;
                    if(linkUrl) extra += `<a href="${linkUrl}" target="_blank" class="btn-primary" style="margin-top:15px; padding:10px;">查看相關連結</a>`;
                } else if (sheetName === '會員專屬影片') {
                    const vLink = item['影片嵌入網址'];
                    if (vLink) {
                        extra = `<div class="video-container" id="vid-${idx}"><iframe src="${vLink}" allowfullscreen></iframe></div>
                                 <button class="btn-primary" style="margin-top:15px; padding:10px;" onclick="document.getElementById('vid-${idx}').style.display='block'; this.style.display='none';">▶️ 播放影片</button>`;
                    }
                } else if (sheetName === '課程介紹') {
                     if(linkUrl) extra += `<a href="${linkUrl}" target="_blank" class="btn-primary" style="margin-top:15px; padding:10px;">報名 / 了解更多</a>`;
                }
                
                let imgHtml = '';
                if (imgUrl) {
                    const firstImg = imgUrl.split(',')[0].trim();
                    imgHtml = `<img src="${firstImg}" class="post-img">`;
                }

                if (sheetName === '最新消息') {
                     html += `<div class="card">${extra}<div class="card-title">${title}</div><div class="card-desc">${desc.replace(/\n/g, '<br>')}</div>${imgHtml}</div>`;
                } else {
                    html += `<div class="card"><div class="card-title">${title}</div><div class="card-desc">${desc.replace(/\n/g, '<br>')}</div>${imgHtml}${extra}</div>`;
                }
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">目前尚無資料</div>';
        }
    } catch(e) { 
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding:30px; color:red;">連線失敗，請稍後重試</div>'; 
    }
}

function buildCommentsHtml(postTitle, postTime, dataIndex) {
    const comments = (window.currentCommentsCache || []).filter(c => c[0] === postTitle && c[1] === postTime);
    let html = '<div style="margin-top:15px; border-top:1px dashed #eee; padding-top:15px; text-align:left;">';
    
    if (comments.length > 0) {
        comments.forEach(c => {
            html += `
            <div style="font-size:13px; margin-bottom:10px; padding:10px; background:#f8f9fa; border-radius:8px; border-left:3px solid var(--app-gold);">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong style="color:var(--app-blue);">${c[2]}</strong>
                    <span style="color:#aaa; font-size:11px;">${c[3]}</span>
                </div>
                <div style="color:var(--text-main); line-height:1.5;">${c[4].replace(/\n/g, '<br>')}</div>
            </div>`;
        });
    } else {
        html += `<div style="font-size:12px; color:#aaa; margin-bottom:10px; text-align:center;">目前尚無留言，來搶頭香吧！</div>`;
    }
    
    html += `
        <div style="display:flex; gap:10px; margin-top:10px;" onclick="event.stopPropagation();">
            <input type="text" id="comment-input-${dataIndex}" class="input-field" placeholder="輸入留言..." style="padding:10px; flex:1; font-size:13px;">
            <button class="btn-primary" onclick="submitComment(event, ${dataIndex}, '${postTitle}', '${postTime}')" style="padding:10px 15px; width:auto; border-radius:8px;">留言</button>
        </div>
    </div>`;
    return html;
}

window.submitComment = async function(event, index, postTitle, postTime) {
    if(event) event.stopPropagation(); 
    const input = document.getElementById(`comment-input-${index}`);
    const content = input.value.trim();
    if (!content) { alert('請輸入留言內容！'); return; }

    const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
    const memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
    
    if (!credentials || !memberInfo) {
        alert('請先登入會員才能留言！');
        return;
    }

    const btn = event.target;
    const ogText = btn.innerText;
    btn.innerText = '傳送中...';
    btn.disabled = true;

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            body: JSON.stringify({
                token: API_SECRET_TOKEN,
                action: 'submitComment',
                lineUid: credentials.lineUid,
                postTitle: postTitle,
                postTime: postTime,
                content: content
            })
        });
        alert('留言成功！');
        input.value = '';
        await loadListData('美業資訊交流'); 
    } catch(e) {
        alert('留言失敗，請稍後再試。');
    } finally {
        btn.innerText = ogText;
        btn.disabled = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();

    document.getElementById('btn-submit-register').addEventListener('click', async (e) => {
        const btn = e.target;
        const profileData = {
            nameZh: document.getElementById('r-name').value.trim(), nameEn: document.getElementById('r-enname').value.trim(),
            gender: document.getElementById('r-gender').value, birth: document.getElementById('r-birth').value,
            idNum: document.getElementById('r-id').value.trim(), phone: document.getElementById('r-phone').value.trim(),
            line: document.getElementById('r-line').value.trim(), email: document.getElementById('r-email').value.trim(),
            address: document.getElementById('r-address').value.trim(), edu: document.getElementById('r-edu').value,
            fields: document.getElementById('r-fields').value.trim(), company: document.getElementById('r-company').value.trim(),
            jobTitle: document.getElementById('r-jobtitle').value.trim(), membership: document.getElementById('r-membership').value
        };
        if (!profileData.nameZh || !profileData.birth || !profileData.idNum || !profileData.phone || !profileData.email) {
            alert('請填寫必填星號欄位！'); return;
        }
        btn.innerText = '處理中...'; btn.disabled = true; showPreloader();
        try {
            const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'updateMemberProfile', lineUid: credentials.lineUid, profileData: profileData }) });
            alert('入會申請已送出！請於 LINE 中聯絡客服。');
            let memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
            memberInfo.needsProfileCompletion = false; memberInfo.memberStatus = '待審核';
            localStorage.setItem('cia_member_info', JSON.stringify(memberInfo));
            checkMemberState(memberInfo);
        } catch(err) { alert('儲存失敗'); } finally { btn.innerText = '送出申請'; btn.disabled = false; hidePreloader(); }
    });

    document.getElementById('btn-save-profile').addEventListener('click', async (e) => {
        const btn = e.target;
        const profileData = {
            nameZh: document.getElementById('e-name').value.trim(), nameEn: document.getElementById('e-enname').value.trim(),
            gender: document.getElementById('e-gender').value, birth: document.getElementById('e-birth').value,
            idNum: document.getElementById('e-id').value.trim(), phone: document.getElementById('e-phone').value.trim(),
            line: document.getElementById('e-line').value.trim(), email: document.getElementById('e-email').value.trim(),
            address: document.getElementById('e-address').value.trim(), edu: document.getElementById('e-edu').value,
            fields: document.getElementById('e-fields').value.trim(), company: document.getElementById('e-company').value.trim(),
            jobTitle: document.getElementById('e-jobtitle').value.trim()
        };
        btn.innerText = '更新中...'; btn.disabled = true; showPreloader();
        try {
            const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'editMemberProfile', lineUid: credentials.lineUid, profileData: profileData }) });
            let memberInfo = JSON.parse(localStorage.getItem('cia_member_info'));
            Object.assign(memberInfo, {
                nameEn: profileData.nameEn, gender: profileData.gender, birth: profileData.birth, idNum: profileData.idNum, 
                phone: profileData.phone, lineId: profileData.line, email: profileData.email, address: profileData.address,
                edu: profileData.edu, fields: profileData.fields, company: profileData.company, jobTitle: profileData.jobTitle
            });
            localStorage.setItem('cia_member_info', JSON.stringify(memberInfo));
            alert('資料更新成功！');
            switchNav('dashboard');
        } catch(err) { alert('更新失敗'); } finally { btn.innerText = '儲存變更'; btn.disabled = false; hidePreloader(); }
    });

    document.getElementById('btn-submit-post').addEventListener('click', async (e) => {
        const btn = e.target;
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const fileInput = document.getElementById('post-image');
        if (!title || !content) { alert('請填寫標題與內容！'); return; }
        
        let base64Data = null; let mimeType = null; let fileName = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 5 * 1024 * 1024) { alert('照片超過 5MB 上限！'); return; }
            base64Data = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result.split(',')[1]); rd.readAsDataURL(file); });
            mimeType = file.type; fileName = file.name;
        }

        btn.innerText = '發佈中...'; btn.disabled = true; showPreloader();
        try {
            const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
            let imgUrl = '';
            if (base64Data) {
                const resImg = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'uploadImage', sheetName: '美業資訊交流', base64Data: base64Data, mimeType: mimeType, fileName: fileName }) });
                imgUrl = (await resImg.json()).url;
            }
            await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'userPostExchange', lineUid: credentials.lineUid, postTitle: title, postContent: content, imgUrl: imgUrl }) });
            alert('發佈成功！');
            document.getElementById('post-title').value = ''; document.getElementById('post-content').value = ''; fileInput.value = '';
            switchNav('exchange'); 
        } catch(err) { alert('發佈失敗'); } finally { btn.innerText = '確認發佈'; btn.disabled = false; hidePreloader(); }
    });
});

function fillProfileForm() {
    const m = JSON.parse(localStorage.getItem('cia_member_info'));
    if(!m) return;
    
    document.getElementById('v-memberId').innerText = m.memberId || '審核中';
    document.getElementById('v-level').innerText = m.level || '一般會員';
    document.getElementById('v-expiry').innerText = m.expiryDate ? new Date(m.expiryDate).toISOString().split('T')[0] : '無';
    document.getElementById('v-status').innerText = m.memberStatus || '待審核';

    document.getElementById('e-name').value = m.name || '';
    document.getElementById('e-enname').value = m.nameEn || '';
    if(m.gender) document.getElementById('e-gender').value = m.gender;
    
    if(m.birth) {
        try { document.getElementById('e-birth').value = new Date(m.birth).toISOString().split('T')[0]; } 
        catch(e) { document.getElementById('e-birth').value = ''; }
    }
    
    document.getElementById('e-id').value = m.idNum || '';
    document.getElementById('e-phone').value = m.phone || '';
    document.getElementById('e-line').value = m.lineId || '';
    document.getElementById('e-email').value = m.email || '';
    document.getElementById('e-address').value = m.address || '';
    
    if(m.edu) document.getElementById('e-edu').value = m.edu;
    document.getElementById('e-fields').value = m.fields || '';
    document.getElementById('e-company').value = m.company || '';
    document.getElementById('e-jobtitle').value = m.jobTitle || '';
}
