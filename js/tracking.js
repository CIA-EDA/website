/**
 * 檔案名稱：js/tracking.js
 * 職責：處理訪客停留時間追蹤、浮動按鈕互動、以及表單資料寫入 GAS
 */

// 1. 寫入你專屬的 GAS API 網址與安全密碼
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

// 2. 參數設定：停留 15 分鐘後觸發 (15分鐘 * 60秒 * 1000毫秒 = 900,000)
const POPUP_DELAY_MS = 15 * 60 * 1000; 

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('lead-popup');
    const openBtn = document.getElementById('open-contact-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const submitBtn = document.getElementById('submit-lead-btn');

    // -- 視窗開關控制邏輯 --
    function showModal() {
        modal.classList.add('active');
    }
    
    function closeModal() {
        modal.classList.remove('active');
    }

    // 點擊右下角按鈕打開表單
    openBtn.addEventListener('click', showModal);
    
    // 點擊右上角 X 關閉表單
    closeBtn.addEventListener('click', closeModal);
    
    // 點擊半透明黑底也能關閉表單
    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            closeModal();
        }
    });

    // -- 自動跳出追蹤邏輯 --
    // 檢查使用者是否已經留過資料 (避免一直打擾)
    const hasSubmitted = localStorage.getItem('cla_lead_submitted');
    if (!hasSubmitted) {
        // 設定 15 分鐘計時器
        setTimeout(() => {
            // 時間到，自動彈出
            showModal();
        }, POPUP_DELAY_MS);
    }

    // -- 表單送出至 GAS 邏輯 --
    submitBtn.addEventListener('click', async () => {
        // 取得使用者輸入的資料
        const name = document.getElementById('lead-name').value.trim();
        const phone = document.getElementById('lead-phone').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        const line = document.getElementById('lead-line').value.trim();
        const course = document.getElementById('lead-course').value;
        const remarks = document.getElementById('lead-remarks').value.trim();

        // 簡單驗證必填欄位
        if (!name || !phone) {
            alert('請務必填寫「姓名」與「手機」以便我們聯絡您喔！');
            return;
        }

        // 改變按鈕文字，讓使用者知道正在傳送
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = '資料傳送中...';
        submitBtn.disabled = true;

        try {
            // 準備傳送給 GAS 的時間與資料陣列 (對應 Google Sheet 的直行)
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            
            // 這些資料會依序寫入 Sheet 的 A, B, C, D, E, F, G 欄
            const newRowData = [timestamp, name, phone, email, line, course, remarks];

            // 呼叫 GAS API
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '訪客數據', // 指定寫入約定好的新工作表
                    newRowData: newRowData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('感謝您的填寫！專業顧問將會盡快與您聯繫。');
                // 標記已送出，未來 15 分鐘到了就不會再跳出
                localStorage.setItem('cla_lead_submitted', 'true');
                closeModal();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('送出失敗:', error);
            alert('抱歉，資料傳送時發生錯誤，請稍後再試或直接透過 Line 聯繫我們。');
        } finally {
            // 恢復按鈕狀態
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
