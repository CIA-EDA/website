/**
 * 檔案名稱：js/tracking.js
 * 職責：處理訪客停留時間追蹤、浮動按鈕互動、以及表單資料寫入 GAS
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec'; 
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const POPUP_DELAY_MS = 15 * 60 * 1000; 

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('lead-popup');
    const openBtn = document.getElementById('open-contact-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    const submitBtn = document.getElementById('submit-lead-btn');

    function showModal() { modal.classList.add('active'); }
    function closeModal() { modal.classList.remove('active'); }

    openBtn.addEventListener('click', showModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });

    const hasSubmitted = localStorage.getItem('cla_lead_submitted');
    if (!hasSubmitted) {
        setTimeout(() => { showModal(); }, POPUP_DELAY_MS);
    }

    submitBtn.addEventListener('click', async () => {
        const name = document.getElementById('lead-name').value.trim();
        const phone = document.getElementById('lead-phone').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        const line = document.getElementById('lead-line').value.trim();
        const course = document.getElementById('lead-course').value;
        const remarks = document.getElementById('lead-remarks').value.trim();

        if (!name || !phone) {
            alert('請務必填寫「姓名」與「手機」以便我們聯絡您喔！');
            return;
        }

        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = '資料傳送中...';
        submitBtn.disabled = true;

        try {
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            const newRowData = [timestamp, name, phone, email, line, course, remarks];

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '訪客數據',
                    newRowData: newRowData
                })
            });

            const result = await response.json();

            if (result.status === 'success') {
                alert('感謝您的填寫！專業顧問將會盡快與您聯繫。');
                localStorage.setItem('cla_lead_submitted', 'true');
                closeModal();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('送出失敗:', error);
            alert('抱歉，資料傳送時發生錯誤，請稍後再試或直接透過 Line 聯繫我們。');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
});
