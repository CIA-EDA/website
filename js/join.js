/**
 * 檔案名稱：js/join.js
 * 職責：處理入會申請表單的資料寫入，以及成功後的金流頁面自動導向
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
// 統一金流的專屬協會付款網址
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('btn-submit-join');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        // 抓取表單資料
        const name = document.getElementById('join-name').value.trim();
        const phone = document.getElementById('join-phone').value.trim();
        const email = document.getElementById('join-email').value.trim();
        const line = document.getElementById('join-line').value.trim();
        const type = document.getElementById('join-type').value;
        const referrer = document.getElementById('join-referrer').value.trim();

        // 簡單驗證
        if (!name || !phone || !email || !type) {
            alert('請務必填寫姓名、電話、Email 與 申請類別！');
            return;
        }

        const originalText = submitBtn.innerText;
        submitBtn.innerText = '資料傳送中，請勿關閉視窗...';
        submitBtn.disabled = true;

        try {
            // 打包資料
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            // 寫入 Google Sheet "入會申請" 的欄位順序：A(時間), B(姓名), C(電話), D(Email), E(Line), F(類別), G(推薦人)
            const newRowData = [timestamp, name, phone, email, line, type, referrer];

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '入會申請', // 請確保您的 Sheet 裡有這個工作表
                    newRowData: newRowData
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                alert('入會申請已成功送出！點擊確認後將引導您至 PayUNi 統一金流付款頁面。');
                // 無縫接軌：成功寫入資料庫後，直接跳轉到付款網址
                window.location.href = PAYUNI_URL;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('傳送失敗，錯誤訊息：' + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
