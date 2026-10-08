/**
 * 檔案名稱：js/admin.js
 * 職責：負責管理後台的密碼驗證、切換頁籤，及將各分類資料安全寫入對應的 Sheet
 */

const ADMIN_PASSWORD = '6668888';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 密碼驗證邏輯 ---
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const pwdInput = document.getElementById('admin-pwd-input');
    const btnLogin = document.getElementById('btn-login');

    btnLogin.addEventListener('click', () => {
        if (pwdInput.value === ADMIN_PASSWORD) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            pwdInput.value = '';
        } else {
            alert('密碼錯誤，請重新輸入。');
            pwdInput.value = '';
        }
    });
    pwdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnLogin.click(); });

    // --- 2. 頁籤切換邏輯 ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const containers = document.querySelectorAll('.dashboard-container');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            containers.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 3. 動態表單資料上傳邏輯 ---
    const publishBtns = document.querySelectorAll('.btn-publish');
    
    publishBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetSheet = btn.getAttribute('data-sheet'); 
            const container = btn.parentElement;
            
            // 抓取該區塊內所有的 data-input 欄位 (包含 input 與 textarea)
            const inputs = container.querySelectorAll('.data-input');
            const newRowData = [];
            let isFirstFieldEmpty = false;

            inputs.forEach((input, index) => {
                const val = input.value.trim();
                newRowData.push(val);
                // 假設第一個欄位必填
                if (index === 0 && val === '') {
                    isFirstFieldEmpty = true;
                }
            });

            if (isFirstFieldEmpty) {
                alert('請至少填寫第一個標題/名稱欄位！');
                return;
            }

            const originalBtnText = btn.innerText;
            btn.innerText = '上傳中，請稍候...';
            btn.disabled = true;

            try {
                const response = await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        token: API_SECRET_TOKEN,
                        sheetName: targetSheet, // 精準送到對應的工作表
                        newRowData: newRowData
                    })
                });

                const result = await response.json();
                
                if (result.status === 'success') {
                    alert(`成功發佈至【${targetSheet}】！前台網頁已同步更新。`);
                    inputs.forEach(input => input.value = ''); // 成功後清空表單
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert('上傳失敗，請確認網路或 API 設定：\n' + error.message);
            } finally {
                btn.innerText = originalBtnText;
                btn.disabled = false;
            }
        });
    });
});
