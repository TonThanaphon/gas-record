document.addEventListener('DOMContentLoaded', () => {
            // IMPORTANT: Paste your deployed Google Apps Script API URL here
            const API_URL = 'https://script.google.com/macros/s/AKfycbzk_NR-n_Yiti88yyAjbcrHTBaT1Owlhiq8pymy6SWuwOUfZaOXPWiWEuKc3N1QXhaMJA/exec';
            
            // Select all necessary HTML elements once
            const splashScreen = document.getElementById('splash-screen');
            const mainContent = document.getElementById('main-content');
            const logo = document.getElementById('logo');
            const smallLogo = document.getElementById('small-logo');
            const loginForm = document.getElementById('login-form');
            const dataForm = document.getElementById('data-form');
            const loginBtn = document.getElementById('login-btn');
            const userIdInput = document.getElementById('user-id');
            const loginMessage = document.getElementById('login-message');
            const dataEntryForm = document.getElementById('data-entry-form');
            const submitBtn = document.getElementById('submit-btn');
            const gasTypeInput = document.getElementById('gas-type');
            const remainPressureInput = document.getElementById('remain-pressure');
            const photoUploadInput = document.getElementById('photo-upload');
            const submitMessage = document.getElementById('submit-message');
            const fileInfo = document.getElementById('file-info');

            let employeeId = ''; // To store the logged-in user's ID

            // 1. Splash Screen Logic
            setTimeout(() => {
                logo.classList.add('logo-shrink-up');
                logo.addEventListener('animationend', () => {
                    splashScreen.style.display = 'none';
                    mainContent.style.display = 'block';
                    smallLogo.classList.remove('hidden');
                    getDropdownData();
                }, { once: true });
            }, 3000);

            // 2. API Fetch Function แบบปรับปรุง
            async function callApi(action, data, isFileUpload = false) {
                try {
                    let requestBody;
                    
                    if (isFileUpload) {
                        // สำหรับการอัปโหลดไฟล์ ใช้ FormData ที่ส่งมาเลย
                        requestBody = data;
                    } else {
                        // สำหรับการส่งข้อมูลปกติ (Login, getGasNames)
                        const formData = new FormData();
                        formData.append('action', action);
                        if (data) {
                            for (const key in data) {
                                if (data[key] !== null && data[key] !== undefined) {
                                    formData.append(key, data[key]);
                                }
                            }
                        }
                        requestBody = formData;
                    }
                    
                    console.log('Sending request:', action, isFileUpload ? 'with file' : 'normal');
                    
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        body: requestBody
                    });

                    console.log('Response status:', response.status);
                    console.log('Response ok:', response.ok);

                    // ตรวจสอบว่า response สำเร็จหรือไม่
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Response error text:', errorText);
                        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                    }
                    
                    const responseText = await response.text();
                    console.log('Raw response:', responseText);
                    
                    try {
                        const result = JSON.parse(responseText);
                        console.log('Parsed result:', result);
                        return result;
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        console.error('Response was:', responseText);
                        throw new Error('Invalid response format from server');
                    }
                } catch (error) {
                    console.error("API call failed:", error);
                    
                    // ให้ข้อความ error ที่ละเอียดมากขึ้น
                    if (error.message.includes('Failed to fetch')) {
                        throw new Error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
                    } else if (error.message.includes('HTTP error')) {
                        throw new Error("เซิร์ฟเวอร์ตอบสนองผิดพลาด: " + error.message);
                    } else if (error.message.includes('Invalid response format')) {
                        throw new Error("ได้รับข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง");
                    } else {
                        throw error;
                    }
                }
            }

            // 3. User Login & Validation
            loginBtn.addEventListener('click', async () => {
                const userId = userIdInput.value.trim();
                if (!userId) {
                    loginMessage.textContent = 'กรุณากรอก User ID';
                    loginMessage.className = 'message error';
                    return;
                }

                loginMessage.textContent = 'กำลังตรวจสอบ...';
                loginMessage.className = 'message';

                try {
                    const response = await callApi('validateUser', { employeeId: userId });
                    if (response.isValid) {
                        employeeId = userId;
                        loginForm.style.display = 'none';
                        dataForm.style.display = 'block';
                        loginMessage.textContent = '';
                    } else {
                        loginMessage.textContent = response.message || 'User ID ไม่ถูกต้อง';
                        loginMessage.className = 'message error';
                    }
                } catch (error) {
                    loginMessage.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message;
                    loginMessage.className = 'message error';
                }
            });

            // 4. Populate Dropdown List
            async function getDropdownData() {
                try {
                    const gasNames = await callApi('getGasNames', {});
                    gasTypeInput.innerHTML = '<option value="">เลือกประเภทแก๊ส</option>';
                    
                    if (Array.isArray(gasNames)) {
                        gasNames.forEach(name => {
                            const option = document.createElement('option');
                            option.value = name;
                            option.textContent = name;
                            gasTypeInput.appendChild(option);
                        });
                    }
                } catch (error) {
                    console.error('Failed to get gas names:', error);
                    const option = document.createElement('option');
                    option.textContent = 'ไม่สามารถโหลดข้อมูลได้';
                    gasTypeInput.appendChild(option);
                    gasTypeInput.disabled = true;
                }
            }

            // 5. File Upload Handler - แสดงข้อมูลไฟล์
            photoUploadInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // ตรวจสอบประเภทไฟล์
                    if (!file.type.startsWith('image/')) {
                        fileInfo.innerHTML = '<span style="color: red;">กรุณาเลือกไฟล์รูปภาพเท่านั้น</span>';
                        photoUploadInput.value = '';
                        checkFormValidity();
                        return;
                    }
                    
                    // ตรวจสอบขนาดไฟล์ (5MB)
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                        fileInfo.innerHTML = '<span style="color: red;">ไฟล์ใหญ่เกิน 5MB กรุณาเลือกไฟล์ใหม่</span>';
                        photoUploadInput.value = '';
                        checkFormValidity();
                        return;
                    }
                    
                    fileInfo.innerHTML = `<span class="file-selected">✓ เลือกไฟล์: ${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>`;
                } else {
                    fileInfo.innerHTML = '';
                }
                checkFormValidity();
            });

            // 6. Form Validation (real-time)
            const inputs = [gasTypeInput, remainPressureInput, photoUploadInput];
            function checkFormValidity() {
                const allFilled = inputs.every(input => {
                    if (input.type === 'file') {
                        return input.files && input.files.length > 0;
                    }
                    return input.value && input.value.trim() !== '';
                });
                
                submitBtn.disabled = !allFilled;
                submitBtn.style.backgroundColor = allFilled ? '#2c3e50' : '#bdc3c7';
            }
            
            inputs.forEach(input => {
                input.addEventListener('input', checkFormValidity);
                input.addEventListener('change', checkFormValidity);
            });

            // 7. Form Submission - แก้ไขแล้ว
            dataEntryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // ป้องกันการส่งซ้ำ
                if (submitBtn.disabled) return;
                
                submitBtn.disabled = true;
                submitMessage.textContent = 'กำลังส่งข้อมูล...';
                submitMessage.className = 'message';

                const photoFile = photoUploadInput.files[0];

                // ตรวจสอบข้อมูลทั้งหมดอีกครั้ง
                if (!employeeId || !gasTypeInput.value || !remainPressureInput.value || !photoFile) {
                    submitMessage.textContent = 'กรุณากรอกข้อมูลให้ครบถ้วนและแนบรูปภาพ';
                    submitMessage.className = 'message error';
                    submitBtn.disabled = false;
                    return;
                }

                try {
                    // สร้าง FormData สำหรับส่งข้อมูลพร้อมไฟล์
                    const formData = new FormData();
                    formData.append('action', 'submitData');
                    formData.append('employeeId', employeeId);
                    formData.append('gasName', gasTypeInput.value);
                    formData.append('remainPressure', remainPressureInput.value);
                    formData.append('photo', photoFile);

                    console.log('Sending data:', {
                        action: 'submitData',
                        employeeId: employeeId,
                        gasName: gasTypeInput.value,
                        remainPressure: remainPressureInput.value,
                        photoName: photoFile.name,
                        photoSize: photoFile.size
                    });

                    // ใช้ callApi แบบพิเศษสำหรับอัปโหลดไฟล์
                    const result = await callApi('submitData', formData, true);

                    if (result && result.status === 'success') {
                        submitMessage.textContent = 'บันทึกข้อมูลสำเร็จ!';
                        submitMessage.className = 'message success';
                        
                        // รีเซ็ตฟอร์ม
                        dataEntryForm.reset();
                        fileInfo.innerHTML = '';
                        checkFormValidity();
                    } else {
                        const errorMsg = result?.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
                        submitMessage.textContent = 'บันทึกข้อมูลไม่สำเร็จ: ' + errorMsg;
                        submitMessage.className = 'message error';
                    }
                } catch (error) {
                    console.error('Submission error:', error);
                    submitMessage.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message;
                    submitMessage.className = 'message error';
                } finally {
                    submitBtn.disabled = false;
                }
            });

            // Allow Enter key to submit login
            userIdInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    loginBtn.click();
                }
            });
        });