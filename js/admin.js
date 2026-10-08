/**
 * 檔案名稱：js/admin.js
 * 職責：100% 完整的後台資料上傳引擎，支援多圖上傳與 Base64 轉換
 */

const ADMIN_PASSWORD = '6668888';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzEMZYK-hDp7SAjNRdBTzgrtXuYqnSejl8a-BPu7-EobxyEvjOrTlTkD8fcSCEGyUeC1Q/exec';
const API_SECRET_TOKEN = 'cla-eda-secure-2026';

const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

document.addEventListener('DOMContentLoaded', () => {
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
    
    pwdInput.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') btnLogin.click(); 
    });

    const tabBtns = document.querySelectorAll('.tab-btn');
    const containers = document.querySelectorAll('.dashboard-container');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active')); 
            containers.forEach(c => c.classList.remove('active'));
            btn.classList.add('active'); 
            document.getElementById(btn.getAttribute('data-target')).classList.add('active');
        });
    });

    const publishBtns = document.querySelectorAll('.btn-publish');
    
    publishBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const targetSheet = btn.getAttribute('data-sheet'); 
            const container = btn.parentElement;
            const inputs = container.querySelectorAll('.data-input');
            const newRowData = [];
            
            if (inputs[0].value.trim() === '') { 
                alert('請至少填寫第一個標題/名稱欄位！'); 
                return; 
            }

            const originalBtnText = btn.innerText;
            btn.disabled = true;

            try {
                for (let i = 0; i < inputs.length; i++) {
                    const input = inputs[i];
                    if (input.type === 'file') {
                        const files = input.files;
                        if (files.length > 0) {
                            const uploadedUrls = [];
                            for (let f = 0; f < files.length; f++) {
                                btn.innerText = `上傳圖片中 (${f+1}/${files.length})...`;
                                const base64Data = await readFileAsBase64(files[f]);
                                const response = await fetch(GAS_URL, {
                                    method: 'POST',
                                    body: JSON.stringify({ 
                                        token: API_SECRET_TOKEN, 
                                        action: 'uploadImage', 
                                        base64Data: base64Data, 
                                        mimeType: files[f].type, 
                                        fileName: files[f].name 
                                    })
                                });
                                const result = await response.json();
                                if(result.status === 'success') {
                                    uploadedUrls.push(result.url);
                                } else {
                                    throw new Error(result.message);
                                }
                            }
                            newRowData.push(uploadedUrls.join(','));
                        } else { 
                            newRowData.push(""); 
                        }
                    } else { 
                        newRowData.push(input.value.trim()); 
                    }
                }

                btn.innerText = '發佈資料中...';
                
                const finalResponse = await fetch(GAS_URL, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        token: API_SECRET_TOKEN, 
                        sheetName: targetSheet, 
                        newRowData: newRowData 
                    })
                });
                
                const finalResult = await finalResponse.json();
                
                if (finalResult.status === 'success') {
                    alert(`成功發佈！前台網頁已同步更新。`);
                    inputs.forEach(input => { 
                        if(input.type === 'file') input.value = ''; 
                        else input.value = ''; 
                    }); 
                } else { 
                    throw new Error(finalResult.message); 
                }
            } catch (error) { 
                alert('上傳失敗：\n' + error.message); 
            } finally { 
                btn.innerText = originalBtnText; 
                btn.disabled = false; 
            }
        });
    });
});
