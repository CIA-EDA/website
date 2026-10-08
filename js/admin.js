/**
 * 檔案名稱：js/admin.js
 * 職責：負責管理後台的密碼驗證、切換頁籤，及將各分類資料寫入對應的 Sheet
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
            // 移除所有啟動狀態
            tabBtns.forEach(b => b.classList.remove('active'));
            containers.forEach(c => c.classList.remove('active'));
            
            // 啟動點擊的目標
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- 3. 發佈資料至對應的資料庫 ---
    const publishBtns = document.querySelectorAll('.btn-publish');
    
    publishBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetSheet = btn.getAttribute('data-sheet'); // 取得要寫入的工作表名稱
            const container = btn.parentElement;
            
            // 抓取該區塊內所有的 input 欄位資料 (按順序排列)
            const inputs = container.querySelectorAll('.input-field');
            const newRowData = [];
            let isComplete = true;

            inputs.forEach((input, index) => {
                newRowData.push(input.value.trim());
                // 假設第一個欄位必填
                if (index === 0 && input.value.trim() === '') {
                    isComplete = false;
                }
            });

            if (!isComplete) {
                alert('請至少填寫第一個標題欄位！');
                return;
            }

            const originalBtnText = btn.innerText;
            btn.innerText = '上傳中...';
            btn.disabled = true;

            try {
                const response = await fetch(GAS_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        token: API_SECRET_TOKEN,
                        sheetName: targetSheet, // 動態指定寫入的工作表
                        newRowData: newRowData
                    })
                });

                const result = await response.json();
                if (result.status === 'success') {
                    alert(`成功發佈至【${targetSheet}】資料庫！`);
                    inputs.forEach(input => input.value = ''); // 清空表單
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                alert('上傳失敗：' + error.message);
            } finally {
                btn.innerText = originalBtnText;
                btn.disabled = false;
            }
        });
    });
});
