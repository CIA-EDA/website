/**
 * 檔案名稱：js/admin.js
 * 職責：負責管理後台的密碼驗證、以及將新課程資料寫入 GAS 資料庫
 */

/* =========================================================
   管理員設定區 (您可以隨時在此修改密碼與 API 設定)
   ========================================================= */
const ADMIN_PASSWORD = '6668888'; // 進入後台的專屬密碼
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026'; // GAS 寫入安全驗證碼

// 等待網頁載入完成
document.addEventListener('DOMContentLoaded', () => {
    
    // 取得 HTML 元素
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const pwdInput = document.getElementById('admin-pwd-input');
    const btnLogin = document.getElementById('btn-login');
    const btnAddCourse = document.getElementById('btn-add-course');

    // --- 1. 密碼驗證邏輯 ---
    btnLogin.addEventListener('click', () => {
        const inputPwd = pwdInput.value;
        if (inputPwd === ADMIN_PASSWORD) {
            // 密碼正確，隱藏登入區，顯示後台區
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            pwdInput.value = ''; // 清空密碼欄位確保安全
        } else {
            alert('密碼錯誤，請重新輸入。');
            pwdInput.value = '';
        }
    });

    // 允許在密碼框按 Enter 鍵直接登入
    pwdInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnLogin.click();
        }
    });

    // --- 2. 新增課程寫入資料庫邏輯 ---
    btnAddCourse.addEventListener('click', async () => {
        
        // 抓取表單內填寫的值
        const title = document.getElementById('course-title').value.trim();
        const desc = document.getElementById('course-desc').value.trim();
        const teacher = document.getElementById('course-teacher').value.trim();
        const img = document.getElementById('course-img').value.trim();
        const link = document.getElementById('course-link').value.trim();

        // 簡單防呆驗證
        if (!title) {
            alert('請至少輸入「課程名稱/活動標題」喔！');
            return;
        }

        // 變更按鈕狀態，防止重複點擊
        const originalBtnText = btnAddCourse.innerText;
        btnAddCourse.innerText = '資料上傳中，請稍候...';
        btnAddCourse.disabled = true;

        try {
            // 將資料打包成陣列，順序必須與 Google Sheet (工作表1) 的欄位完全對應：
            // [課程名稱, 簡介, 講師, 圖片網址, 報名連結]
            const newRowData = [title, desc, teacher, img, link];

            // 呼叫 GAS API 進行寫入
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '工作表1', // 寫入到課程清單
                    newRowData: newRowData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('發佈成功！首頁已經自動更新了。');
                
                // 清空表單，方便連續新增下一筆
                document.getElementById('course-title').value = '';
                document.getElementById('course-desc').value = '';
                document.getElementById('course-teacher').value = '';
                document.getElementById('course-img').value = '';
                document.getElementById('course-link').value = '';
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('寫入失敗:', error);
            alert('抱歉，資料發佈失敗。錯誤訊息：' + error.message);
        } finally {
            // 恢復按鈕狀態
            btnAddCourse.innerText = originalBtnText;
            btnAddCourse.disabled = false;
        }
    });
});
