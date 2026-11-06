/**
 * 檔案名稱：js/ui.js
 * 職責：負責畫面的組裝、卡片渲染、網格佈局
 */

function buildMemberDashboard(memberInfo) {
    let avatarHtml = memberInfo.avatar ? `<img src="${memberInfo.avatar}" style="width:60px; height:60px; border-radius:50%; vertical-align:middle; margin-right:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">` : '';
    let badgeHtml = memberInfo.level ? `<span style="background:var(--champagne); color:#fff; font-size:13px; padding:4px 12px; border-radius:20px; font-weight:bold;">${memberInfo.level}</span>` : '';
    
    return `
        <div style="background:#fff; border-radius:12px; padding:40px 30px; box-shadow:0 10px 30px rgba(0,0,0,0.05); margin:0 auto; max-width: 600px;">
            <div style="display:flex; align-items:center; justify-content:center; margin-bottom:10px; flex-wrap:wrap;">
                ${avatarHtml}
                <div style="text-align:left;">
                    <h3 style="margin:0 0 5px 0; color:var(--ink-navy); font-size:22px;">${memberInfo.name}，您好！</h3>
                    ${badgeHtml}
                </div>
            </div>
            <div class="dashboard-grid">
                <a href="#course-platform" class="dashboard-card"><div class="dashboard-icon">🎬</div><div class="dashboard-title">線上課程</div></a>
                <a href="#exchange" class="dashboard-card"><div class="dashboard-icon">💬</div><div class="dashboard-title">美業交流</div></a>
                <a href="#jobs" class="dashboard-card"><div class="dashboard-icon">🏢</div><div class="dashboard-title">徵才專區</div></a>
                <a href="#edit-profile" class="dashboard-card"><div class="dashboard-icon">⚙️</div><div class="dashboard-title">修改資料</div></a>
            </div>
            <button onclick="logoutMember()" style="display:block; width:100%; margin-top:25px; padding:12px; background:#f8f9fa; border:1px solid #ddd; border-radius:8px; color:var(--text-dark); cursor:pointer; font-weight:bold;">登出帳號</button>
        </div>
    `;
}

function buildHomeNavigation() {
    return `
        <div class="home-nav-grid">
            <a href="#gallery" class="home-nav-card"><div class="home-nav-icon">📸</div><div class="home-nav-title">活動花絮</div></a>
            <a href="#team" class="home-nav-card"><div class="home-nav-icon">🎓</div><div class="home-nav-title">專業師資</div></a>
            <a href="#consultants" class="home-nav-card"><div class="home-nav-icon">🏆</div><div class="home-nav-title">專業顧問</div></a>
        </div>
    `;
}

async function loadPage() {
    showPreloader(); 
    setTimeout(hidePreloader, 3000); // 獨立頁面載入保險
    
    const hash = window.location.hash || '#news';
    const config = PAGE_CONFIG[hash] || PAGE_CONFIG['#news'];

    const pageTitleEl = document.getElementById('page-title');
    const pageSubtitleEl = document.getElementById('page-subtitle');
    if(pageTitleEl) pageTitleEl.innerText = config.title;
    if(pageSubtitleEl) pageSubtitleEl.innerText = config.subtitle;
    
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === hash) link.classList.add('active');
        else link.classList.remove('active');
    });

    const dataContainer = document.getElementById('data-container');
    const loginContainer = document.getElementById('login-container');
    const profileContainer = document.getElementById('profile-completion-container');
    const editProfileContainer = document.getElementById('edit-profile-container');
    const joinPromptContainer = document.getElementById('join-prompt-container'); 
    const actionContainer = document.getElementById('action-container'); 
    const homeNavContainer = document.getElementById('home-nav-container');

    if(!dataContainer) { hidePreloader(); return; }

    dataContainer.style.display = 'none';
    loginContainer.style.display = 'none';
    if(profileContainer) profileContainer.style.display = 'none';
    if(editProfileContainer) editProfileContainer.style.display = 'none';
    if(joinPromptContainer) joinPromptContainer.style.display = 'none';
    if(homeNavContainer) homeNavContainer.style.display = 'none';
    
    actionContainer.style.display = 'none';
    actionContainer.innerHTML = '';
    dataContainer.innerHTML = '';

    if (hash === '#exchange') {
        actionContainer.style.display = 'block';
        actionContainer.innerHTML = `<button id="btn-open-post" class="candy-btn" style="background: var(--ink-navy); color: white !important;">📝 我要發文</button>`;
        document.getElementById('btn-open-post').addEventListener('click', () => {
            const memberInfo = getSafeMemberInfo();
            if (!memberInfo || !isAuthValid()) {
                alert('發文功能僅限會員使用，請先登入！');
                window.location.hash = '#member-zone';
                return;
            }
            if (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') {
                alert(`您目前的狀態為【${memberInfo.memberStatus}】，無法發文。`);
                return;
            }
            document.getElementById('post-modal').classList.add('active');
        });
    }

    if (config.isJoinIntent || config.isMember || config.isEditProfile) {
        if (!isAuthValid()) { hidePreloader(); return; } 
        const credentials = getSafeCredentials();
        const memberInfo = getSafeMemberInfo();
        
        if (!credentials) {
            if (config.isJoinIntent && joinPromptContainer) joinPromptContainer.style.display = 'block';
            else loginContainer.style.display = 'block';
            hidePreloader(); return;
        }

        if (memberInfo && memberInfo.needsProfileCompletion) {
            profileContainer.style.display = 'block';
            document.getElementById('p-name-zh').value = memberInfo.name || '';
            if(pageSubtitleEl) pageSubtitleEl.innerHTML = `<span style="color:var(--champagne); font-weight:bold;">LINE 授權成功！請繼續完成第二步。</span>`;
            hidePreloader(); return;
        }
        
        if (config.isEditProfile) {
            editProfileContainer.style.display = 'block';
            document.getElementById('v-memberId').innerText = memberInfo.memberId || '審核中';
            document.getElementById('v-level').innerText = memberInfo.level || '一般會員';
            document.getElementById('v-expiry').innerText = memberInfo.expiryDate ? new Date(memberInfo.expiryDate).toISOString().split('T')[0] : '無';
            document.getElementById('v-status').innerText = memberInfo.memberStatus || '待審核';

            document.getElementById('e-name-zh').value = memberInfo.name || '';
            document.getElementById('e-name-en').value = memberInfo.nameEn || '';
            if(memberInfo.gender) document.getElementById('e-gender').value = memberInfo.gender;
            
            if(memberInfo.birth) {
                try { document.getElementById('e-birth').value = new Date(memberInfo.birth).toISOString().split('T')[0]; } 
                catch(e) { document.getElementById('e-birth').value = ''; }
            }
            
            document.getElementById('e-id').value = memberInfo.idNum || '';
            document.getElementById('e-phone').value = memberInfo.phone || '';
            document.getElementById('e-line').value = memberInfo.lineId || '';
            document.getElementById('e-email').value = memberInfo.email || '';
            document.getElementById('e-address').value = memberInfo.address || '';
            
            if(memberInfo.edu) document.getElementById('e-edu').value = memberInfo.edu;
            document.getElementById('e-fields').value = memberInfo.fields || '';
            document.getElementById('e-company').value = memberInfo.company || '';
            document.getElementById('e-jobtitle').value = memberInfo.jobTitle || '';

            hidePreloader(); return;
        }

        if (config.isJoinIntent) {
            if(pageSubtitleEl) pageSubtitleEl.innerHTML = `<span style="color:#e53e3e;">您已完成入會申請，目前狀態：${memberInfo.level}。</span><br>若權限遭停用或審核中，請靜候管理員通知或聯絡協會。`;
        }

        if (memberInfo && (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核')) {
            if(pageSubtitleEl) pageSubtitleEl.innerHTML = `<span style="color:#e53e3e;">您已完成資料綁定，目前狀態：${memberInfo.memberStatus}。</span>`;
            dataContainer.style.display = 'block';
            let avatarHtml = memberInfo.avatar ? `<img src="${memberInfo.avatar}" style="width:50px; height:50px; border-radius:50%; vertical-align:middle; margin-right:15px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">` : '';
            dataContainer.innerHTML = `
                <div style="background:#fff; border-radius:12px; padding:50px; text-align:center; box-shadow:0 10px 30px rgba(0,0,0,0.05); max-width:600px; margin:0 auto;">
                    <div style="margin-bottom:30px;">
                        ${avatarHtml}
                        <h3 style="display:inline-block; margin:0; color:var(--ink-navy); font-size:24px; vertical-align:middle;">${memberInfo.name}，您好！</h3>
                    </div>
                    <div style="padding:20px; background:#fff3cd; color:#856404; border-radius:8px; margin-bottom:30px; text-align:left; font-size:15px; line-height:1.6;">
                        <strong>⏳ 您的會員資格正在審核中</strong><br>請前往官方 LINE 聯繫客服人員進行人工確認與繳費。<br>在審核通過前，無法存取專屬功能，但您仍可自由瀏覽網站公開資訊。
                    </div>
                    <button onclick="logoutMember()" style="display:block; margin:20px auto 0; background:none; border:none; color:red; text-decoration:underline; cursor:pointer;">登出帳號</button>
                </div>
            `;
            hidePreloader(); return;
        }

        dataContainer.style.display = 'block';
        dataContainer.innerHTML = buildMemberDashboard(memberInfo);
        hidePreloader(); return;
    }

    dataContainer.style.display = 'block'; 

    try {
        const credentials = JSON.parse(localStorage.getItem('cia_member_credentials'));
        let res;
        
        if (config.sheet === '會員專屬影片') {
             res = await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'verifyAndGetCourses', credentials: credentials }) });
        } else {
             const result = await fetchWithCache(config.sheet);
             res = { json: async () => result }; 
        }
        const dataObj = await res.json();
        
        if (config.sheet === '美業資訊交流') {
            const commentsRes = await fetchWithCache('交流留言');
            if (commentsRes.status === 'success' && commentsRes.data.length > 1) {
                window.currentCommentsCache = commentsRes.data.slice(1);
            } else {
                window.currentCommentsCache = [];
            }
        }

        if (dataObj.status === 'success' && dataObj.data.length > 1) {
            let dataArray = dataObj.data;
            const headers = dataArray.shift();
            if (config.sheet === '美業資訊交流' || config.sheet === '最新消息') dataArray = dataArray.reverse();
            dataArray.unshift(headers);
            renderData(dataArray, config.layout, dataContainer);
            
            if ((hash === '' || hash === '#news' || hash === '#home') && homeNavContainer) {
                homeNavContainer.style.display = 'block';
                homeNavContainer.innerHTML = buildHomeNavigation();
            }
        } else {
            dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:#7A7A7A;">目前尚無資料。</p>';
        }
    } catch (error) { 
        console.error("資料載入失敗:", error);
        dataContainer.innerHTML = '<p style="text-align:center; width:100%; color:red;">資料載入異常，請稍後重試。</p>'; 
    } finally { hidePreloader(); }
}

function buildCommentsHtml(postTitle, postTime, dataIndex) {
    const comments = (window.currentCommentsCache || []).filter(c => c[0] === postTitle && c[1] === postTime);
    let html = '<div style="margin-top:15px; border-top:1px dashed #eee; padding-top:15px; text-align:left;">';
    
    if (comments.length > 0) {
        comments.forEach(c => {
            html += `
            <div style="font-size:13px; margin-bottom:10px; padding:10px; background:#f8f9fa; border-radius:8px; border-left:3px solid var(--champagne);">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong style="color:var(--ink-navy);">${c[2]}</strong><span style="color:#aaa; font-size:11px;">${c[3]}</span>
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
            <button class="candy-btn" onclick="submitComment(event, ${dataIndex}, '${postTitle}', '${postTime}')" style="padding:10px 15px; width:auto; border-radius:8px;">留言</button>
        </div>
    </div>`;
    return html;
}

function renderData(rawData, layoutType, container) {
    const headers = rawData[0];
    currentViewDataCache = []; 
    
    let html = layoutType === 'article' ? '<div style="max-width: 800px; margin: 0 auto; width:100%;">' : '<div class="responsive-grid">';
    
    for (let i = 1; i < rawData.length; i++) {
        let item = {};
        for (let j = 0; j < headers.length; j++) item[headers[j]] = rawData[i][j];
        
        currentViewDataCache.push(item);
        const dataIndex = currentViewDataCache.length - 1;

        const title = item['課程名稱'] || item['講師姓名'] || item['顧問姓名'] || item['店家名稱'] || item['活動名稱'] || item['產品名稱'] || item['標題'] || item['職缺名稱'] || item['主旨/標題'] || '';
        let desc = item['簡介'] || item['個人簡介'] || item['產品簡介'] || item['內容'] || item['交流內容'] || '';
        const imgRaw = item['圖片網址'] || item['照片網址'] || item['活動照片網址'] || item['產品logo及圖檔'] || item['公司Logo或環境照片'] || item['附圖網址'] || item['封面圖片網址'] || '';
        const linkRaw = item['報名連結'] || item['專屬付款網址'] || item['連結'] || item['專屬報名網址'] || item['相關連結'] || ''; 
        
        if (layoutType === 'brand') {
            if (imgRaw) {
                const optimizedUrl = optimizeImageUrl(imgRaw.split(',')[0].trim());
                html += `
                    <a href="${linkRaw || '#'}" target="${linkRaw ? '_blank' : '_self'}" style="display:block; border-radius:16px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); transition:0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <img src="${optimizedUrl}" alt="${title}" style="width:100%; height:auto; display:block; object-fit:cover;">
                    </a>
                `;
            }
            continue; 
        }
        
        let extraHtml = ''; 
        if (item['發佈日期']) {
            extraHtml = `<div style="font-size:12px; color:var(--champagne); margin-bottom:5px; font-weight:bold;">發佈日期：${item['發佈日期']}</div>`;
            if(linkRaw) extraHtml += `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="margin-top:15px; padding:10px;">查看相關連結</a>`;
        } else if (item['徵才機構']) {
            desc = `🏢 機構：${item['徵才機構']}\n📍 地點：${item['工作地點']}\n💰 薪資：${item['薪資待遇']}\n📞 聯絡：${item['聯絡方式']}\n\n【條件要求】\n${item['條件要求']}`;
        } else if (item['發文者姓名']) {
            extraHtml = `<div style="font-size:12px; color:var(--champagne); margin-top:10px;">${item['發文者姓名']} • ${item['發文時間']}</div>`;
            extraHtml += buildCommentsHtml(title, item['發文時間'], dataIndex); 
        } else if (item['專長項目']) {
            desc = `【專長項目】\n${item['專長項目']}\n\n${desc}`;
        } else if (item['店家名稱']) {
            desc = `👤 負責人：${item['負責人']}\n📍 地址：${item['地址']}\n📞 電話：${item['聯絡電話']}\n\n${item['簡介']}`;
        } else if (item['影片嵌入網址']) {
            extraHtml = `<div class="video-container" id="vid-${dataIndex}"><iframe src="${item['影片嵌入網址']}" allowfullscreen></iframe></div>
                         <button class="candy-btn payment-btn" style="margin-top:15px; padding:10px; display:block; width:100%;" onclick="document.getElementById('vid-${dataIndex}').style.display='block'; this.style.display='none';">▶️ 播放影片</button>`;
        }
        
        const imgHtml = generateImageHTML(imgRaw);
        
        let paymentBtnHtml = '';
        if (linkRaw && !item['發佈日期']) {
            paymentBtnHtml = `<a href="${linkRaw}" target="_blank" class="candy-btn payment-btn" style="display:block; text-align:center; margin-top:20px;" onclick="event.stopPropagation();">💳 了解更多 / 報名</a>`;
        }
        if (item['最低權限要求(例如:一般會員)'] !== undefined) {
            const reqLevel = item['最低權限要求(例如:一般會員)'] || '會員';
            paymentBtnHtml = `<button class="candy-btn member-btn" style="display:block; width:100%; text-align:center; margin-top:20px;" onclick="playCourseVideo(event, '${title}', '${reqLevel}')">▶️ 播放線上課程 (${reqLevel}專屬)</button>`;
        }
        
        let shortDesc = desc.length > 60 ? desc.substring(0, 60) + '...' : desc;

        if (layoutType === 'article') {
            html += `<div style="margin-bottom: 50px;">`;
            if (title) html += `<h3 style="color:var(--ink-navy); border-bottom: 2px solid var(--champagne); padding-bottom:10px; margin-bottom:20px; font-size:24px;">${title}</h3>`;
            html += imgHtml;
            html += `<p style="color:var(--text-dark); font-size:16px; line-height:1.8; letter-spacing:0.05em;">${desc.replace(/\n/g, '<br>')}</p>`;
            html += paymentBtnHtml; 
            html += `</div>`;
        } else {
            if (item['發佈日期']) {
                html += `
                    <div class="course-card">
                        <div class="course-info" style="padding:20px;">
                            ${extraHtml}
                            <h3 class="course-title" style="margin-top:10px;">${title}</h3>
                            <p class="course-desc">${shortDesc.replace(/\n/g, '<br>')}</p>
                            ${imgHtml}
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="course-card" onclick="openDetailModal(${dataIndex})" style="cursor: pointer;" title="點擊查看詳細資料">
                        ${imgHtml}
                        <div class="course-info">
                            ${title ? `<h3 class="course-title">${title}</h3>` : ''}
                            ${shortDesc ? `<p class="course-desc">${shortDesc.replace(/\n/g, '<br>')}</p>` : ''}
                            ${paymentBtnHtml}
                            ${extraHtml}
                        </div>
                    </div>
                `;
            }
        }
    }
    if (layoutType !== 'article') html += '</div>';
    container.innerHTML = html;
}
