/**
 * 檔案名稱：js/auth.js
 * 職責：LINE 初始化、登入狀態管理、網站追蹤
 */

function showPreloader() { 
    const p = document.getElementById('preloader'); 
    if(p) { p.style.display = 'flex'; p.style.visibility = 'visible'; p.style.opacity = '1'; }
}

function hidePreloader() { 
    const p = document.getElementById('preloader'); 
    if(p) { p.style.opacity = '0'; p.style.visibility = 'hidden'; setTimeout(() => { p.style.display = 'none'; }, 300); }
}

function initSystem() {
    setTimeout(hidePreloader, 2500); // 終極防呆
    
    loadPage(); // 來自 ui.js

    fetch(`${GAS_URL}?action=getVisitorCount`)
        .then(res => res.json())
        .then(countData => {
            if (countData.status === 'success') {
                const counterEl = document.getElementById('visitor-counter');
                if (counterEl) counterEl.innerText = countData.count.toLocaleString();
            }
        }).catch(e => console.error('計數器載入失敗', e));

    const urlSearch = window.location.search;
    if (urlSearch.includes('liff.state') || urlSearch.includes('code=')) {
        showPreloader();
        try {
            if (typeof liff !== 'undefined') {
                liff.init({ liffId: LIFF_ID }).then(() => {
                    if (liff.isLoggedIn() && !getSafeCredentials()) {
                        handleLineLoginCallback(true);
                    } else {
                        hidePreloader();
                    }
                }).catch((e) => {
                    console.error('LIFF Init 失敗', e);
                    hidePreloader();
                });
            } else { hidePreloader(); }
        } catch (error) { console.error('LIFF 處理錯誤', error); hidePreloader(); }
    }
}

function setupMemberLogin() {
    const lineBtns = document.querySelectorAll('.line-login-trigger');
    lineBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            showPreloader();
            try {
                if (typeof liff === 'undefined') {
                    alert('無法載入 LINE 登入套件，請檢查網路連線。');
                    hidePreloader(); return;
                }
                if (!liff.id) await liff.init({ liffId: LIFF_ID });
                
                if (!liff.isLoggedIn()) {
                    liff.login({ redirectUri: window.location.href.split('?')[0] });
                } else {
                    handleLineLoginCallback();
                }
            } catch(e) {
                alert('登入程序發生錯誤，請重試。');
                hidePreloader();
            }
        });
    });
}

async function handleLineLoginCallback(isSilent = false) {
    if (!isSilent) showPreloader();
    try {
        const profile = await liff.getProfile();
        const res = await fetch(GAS_URL, { 
            method: 'POST', 
            body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'lineLogin', lineUid: profile.userId, displayName: profile.displayName, pictureUrl: profile.pictureUrl }) 
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            localStorage.setItem('cia_member_credentials', JSON.stringify({ lineUid: profile.userId }));
            localStorage.setItem('cia_member_info', JSON.stringify(data.member));
            localStorage.setItem('cia_auth_time', Date.now().toString()); 
            
            updateMemberUI();
            
            if (window.location.search.includes('liff.state') || window.location.search.includes('code=')) {
                window.history.replaceState(null, '', window.location.pathname + (window.location.hash || '#member-zone'));
            }
            
            if (data.member.needsProfileCompletion && window.location.hash !== '#join') {
                window.location.hash = '#join';
            } else if (!isSilent && window.location.hash !== '#member-zone') {
                window.location.hash = '#member-zone'; 
            }
            loadPage();
        } else {
            if (!isSilent) alert('登入失敗：' + data.message);
        }
    } catch(e) { 
        if (!isSilent) alert('連線伺服器失敗，請檢查網路狀態。'); 
    } finally { 
        hidePreloader(); 
    }
}

function updateMemberUI() {
    if (!isAuthValid()) return; 
    const memberInfo = getSafeMemberInfo();
    const memberBtn = document.getElementById('nav-member-btn');
    if (memberInfo && memberBtn) {
        memberBtn.innerHTML = (memberInfo.memberStatus === '停用' || memberInfo.memberStatus === '待審核') ? '⏳ 會員審核中' : '👤 會員專區';
    }
}

function logoutMember() {
    localStorage.removeItem('cia_member_credentials');
    localStorage.removeItem('cia_member_info');
    localStorage.removeItem('cia_auth_time');
    sessionStorage.clear();
    
    try {
        if (typeof liff !== 'undefined' && liff.id && liff.isLoggedIn()) { liff.logout(); }
    } catch(e) {}
    
    alert('已登出。');
    window.location.hash = '#news';
    loadPage();
}

function handlePageTransition() {
    const now = Date.now();
    const durationSeconds = Math.floor((now - currentPageEntryTime) / 1000);
    const ip = localStorage.getItem('visitor_ip') || '未知IP';
    if (durationSeconds > 1) {
        let sessionStr = localStorage.getItem('tracking_session');
        let session = null;
        try { session = sessionStr ? JSON.parse(sessionStr) : null; } catch(e){}
        
        if (!session || (now - session.lastActiveTime > 600000) || session.views >= 10) {
            session = { id: 'SESS_' + now + '_' + Math.floor(Math.random() * 1000), entryTime: getCleanTime(), views: 0 };
        }
        session.views += 1; session.lastActiveTime = now;
        localStorage.setItem('tracking_session', JSON.stringify(session));
        
        fetch(GAS_URL, { 
            method: 'POST', keepalive: true, 
            body: JSON.stringify({ token: API_SECRET_TOKEN, action: 'trackSession', sessionId: session.id, entryTime: session.entryTime, leaveTime: getCleanTime(), ip: ip, path: currentTrackingHash, duration: durationSeconds, userAgent: navigator.userAgent }) 
        }).catch(e=>e);
    }
    currentTrackingHash = window.location.hash || '#news';
    currentPageEntryTime = now;
}
