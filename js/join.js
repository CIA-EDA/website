/**
 * 檔案名稱：js/join.js
 * 職責：處理完整入會申請表單 (支援單選與複選題)
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';
const PAYUNI_URL = 'https://api.payuni.com.tw/api/uop/receive_info/2/1/CCAT968310880001/hQjvQe2jfYEAWXlu2K21X';

document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mainNav = document.getElementById('main-nav-menu');
    if (mobileBtn && mainNav) mobileBtn.addEventListener('click', () => mainNav.classList.toggle('show'));

    const submitBtn = document.getElementById('btn-submit-join');
    if (!submitBtn) return;

    submitBtn.addEventListener('click', async () => {
        // 一般文字與下拉欄位
        const nameZh = document.getElementById('j-name-zh').value.trim();
        const nameEn = document.getElementById('j-name-en').value.trim();
        const birth = document.getElementById('j-birth').value;
        const idNum = document.getElementById('j-id').value.trim();
        const edu = document.getElementById('j-edu').value;
        const company = document.getElementById('j-company').value.trim();
        const jobTitle = document.getElementById('j-jobtitle').value.trim();
        const phone = document.getElementById('j-phone').value.trim();
        const line = document.getElementById('j-line').value.trim();
        const email = document.getElementById('j-email').value.trim();
        const address = document.getElementById('j-address').value.trim();
        const remarks = document.getElementById('j-remarks').value.trim();

        // 複選題 (Checkboxes) - 收集所有打勾的值並用逗號分隔
        const fields = Array.from(document.querySelectorAll('input[name="j-field"]:checked')).map(cb => cb.value).join(' , ');
        const sources = Array.from(document.querySelectorAll('input[name="j-source"]:checked')).map(cb => cb.value).join(' , ');
        const expects = Array.from(document.querySelectorAll('input[name="j-expect"]:checked')).map(cb => cb.value).join(' , ');

        // 單選題 (Radios)
        const membershipNode = document.querySelector('input[name="j-membership"]:checked');
        const membership = membershipNode ? membershipNode.value : '';
        const newsletterNode = document.querySelector('input[name="j-newsletter"]:checked');
        const newsletter = newsletterNode ? newsletterNode.value : '';

        // 必填欄位防呆檢查
        if (!nameZh || !birth || !idNum || !edu || !fields || !company || !phone || !address || !membership || !expects || !newsletter) {
            alert('請務必填寫所有標示星號 (*) 的必填欄位！');
            return;
        }

        const originalText = submitBtn.innerText;
        submitBtn.innerText = '資料加密傳送中，請勿關閉視窗...';
        submitBtn.disabled = true;

        try {
            const timestamp = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
            
            // 嚴格對齊 Code.gs 的 18 個欄位順序
            const newRowData = [
                timestamp, nameZh, nameEn, birth, idNum, 
                edu, fields, company, jobTitle, phone, 
                line, email, address, membership, sources, 
                expects, newsletter, remarks
            ];

            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    token: API_SECRET_TOKEN,
                    sheetName: '入會申請', 
                    newRowData: newRowData
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                alert('入會申請已成功送出！將自動為您引導至線上付款頁面。');
                window.location.href = PAYUNI_URL;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert('傳送失敗，請稍後再試：' + error.message);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
});
