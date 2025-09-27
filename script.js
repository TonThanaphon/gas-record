document.addEventListener('DOMContentLoaded', () => {
            // 📢 LOG: เริ่มต้นการทำงานของ script.js
            console.log('✅ DOM Content Loaded: เริ่มต้นการทำงานของ script.js');

            // IMPORTANT: Paste your deployed Google Apps Script API URL here
            // ต้องใช้ API URL ที่ถูกต้องและทำการ Deploy พร้อมยอมรับสิทธิ์ Drive แล้ว
            const API_URL = 'https://script.google.com/macros/s/AKfycbz5zxXH1s-qntXNxIDX-z7Fhokutpbbi-tbzQ06DyeCEWZHkaldpCAZh73yuEXhnqOKpw/exec';
            
            // Select all necessary HTML elements once
            const splashScreen = document.getElementById('splash-screen');
            const mainContent = document.getElementById('main-content');
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
            
            // NEW UI ELEMENTS for multiple files
            const uploadBox = document.getElementById('upload-box');
            const uploadPrompt = document.getElementById('upload-prompt');
            const addMoreFiles = document.getElementById('add-more-files');
            const fileListContainer = document.getElementById('file-list-container');
            const uploadPromptLabel = document.getElementById('upload-prompt-label'); // Label for the file input

            let employeeId = ''; 
            // Collection to hold all selected files for submission
            let selectedFiles = []; 
            // Collection to hold temporary URLs for cleanup
            let fileUrls = [];

            // Helper to get file icon
            function getFileIcon(mimeType) {
                if (mimeType.startsWith('image/')) {
                    return '🖼️'; // Image
                }
                if (mimeType.includes('pdf')) {
                    return '📄'; // PDF
                }
                return '📎'; // Generic
            }

            // Function to render the list of selected files
            function renderFileList() {
                // Clear old list and old URLs
                fileListContainer.innerHTML = '';
                fileUrls.forEach(url => URL.revokeObjectURL(url));
                fileUrls = [];

                if (selectedFiles.length === 0) {
                    // Reset to initial state
                    uploadPrompt.style.display = 'flex';
                    addMoreFiles.style.display = 'none';
                    uploadBox.classList.remove('file-attached');
                    uploadPromptLabel.style.borderTop = 'none';
                    checkFormValidity();
                    return;
                }
                
                // Set state for attached files
                uploadPrompt.style.display = 'none';
                addMoreFiles.style.display = 'flex';
                uploadBox.classList.add('file-attached');
                uploadPromptLabel.style.borderTop = '1px dashed #ced4da'; // Add separator

                // Build list items
                selectedFiles.forEach((file, index) => {
                    const tempUrl = URL.createObjectURL(file);
                    fileUrls.push(tempUrl); // Store URL for later cleanup
                    
                    const fileEntry = document.createElement('div');
                    fileEntry.className = 'file-entry';
                    fileEntry.setAttribute('data-index', index);
                    
                    fileEntry.innerHTML = `
                        <div class="file-entry-info">
                            <span class="file-icon">${getFileIcon(file.type)}</span> 
                            <span class="file-name" title="${file.name}">${file.name}</span>
                        </div>
                        <span class="remove-btn" title="ลบไฟล์">❌</span>
                    `;
                    
                    // Attach event listener for the remove button
                    fileEntry.querySelector('.remove-btn').addEventListener('click', (e) => {
                        e.stopPropagation(); // Stop click from propagating to the file entry/upload box
                        removeFile(index);
                    });
                    
                    // Attach event listener for preview on click
                    fileEntry.addEventListener('click', (e) => {
                        // Open temporary URL in a new tab for preview
                        window.open(tempUrl, '_blank');
                    });

                    fileListContainer.appendChild(fileEntry);
                });

                checkFormValidity();
            }

            // Function to remove a specific file by index
            function removeFile(indexToRemove) {
                console.log(`🗑️ File Removed: ลบไฟล์ที่ index ${indexToRemove}`);
                selectedFiles.splice(indexToRemove, 1);
                // The input itself is never fully reset, only its value is cleared before a new selection
                photoUploadInput.value = ''; 
                renderFileList();
            }

            // Function to handle the file selection change
            function handleFileChange() {
                const newFiles = Array.from(photoUploadInput.files);
                
                if (newFiles.length > 0) {
                    console.log(`📥 New Files Added: เพิ่มไฟล์ใหม่ ${newFiles.length} ไฟล์`);
                    
                    // Append new files to the existing collection
                    selectedFiles.push(...newFiles);

                    // Reset the value of the input so the 'change' event fires again if the user selects the same file(s)
                    photoUploadInput.value = ''; 
                    
                    // Re-render the list
                    renderFileList();
                }
            }
            photoUploadInput.addEventListener('change', handleFileChange);

            // 1. Splash Screen Logic (Updated: Simple Fade-out)
            setTimeout(() => {
                console.log('⏰ Splash Screen: เริ่ม Fade-out');
                
                smallLogo.style.opacity = '0';
                splashScreen.classList.add('fade-out'); 

                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    mainContent.classList.add('fade-in'); 
                    smallLogo.style.opacity = '1'; 
                    
                }, 700); 

                getDropdownData();
                    
            }, 3000); 

            // 2. API Fetch Function (Non-file submission)
            async function callApi(action, data) {
                console.log(`📡 API Call: เรียกใช้ action "${action}"`);
                const formData = new FormData();
                formData.append('action', action);
                for (const key in data) {
                    formData.append(key, data[key]);
                }
                
                try {
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP Error! Status: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log(`✅ API Call: "${action}" สำเร็จ.`);
                    return result;

                } catch (error) {
                    console.error(`❌ API Call: "${action}" ล้มเหลว. ข้อผิดพลาด:`, error);
                    throw new Error(`Failed to connect to the server or API call failed. Details: ${error.message}`);
                }
            }

            // 3. User Login & Validation
            loginBtn.addEventListener('click', async () => {
                const userId = userIdInput.value.trim();
                console.log(`👤 Login Attempt: ผู้ใช้กรอก User ID: "${userId}"`);

                if (!userId) {
                    loginMessage.textContent = 'กรุณากรอก User ID';
                    loginMessage.className = 'message error';
                    return;
                }
                
                // แสดง Icon Loading แทนข้อความ
                loginMessage.textContent = ''; 
                loginMessage.className = 'message'; 
                loginMessage.innerHTML = '<div class="spinner"></div>'; 

                try {
                    const response = await callApi('validateUser', { employeeId: userId });
                    
                    if (response.isValid) {
                        console.log('✅ Login Success: ผู้ใช้ผ่านการตรวจสอบ');
                        employeeId = userId;
                        loginForm.style.display = 'none';
                        dataForm.style.display = 'block';
                        loginMessage.innerHTML = ''; 
                        checkFormValidity();
                    } else {
                        console.warn('❌ Login Failed:', response.message);
                        loginMessage.innerHTML = response.message || 'User ID ไม่ถูกต้อง'; 
                        loginMessage.className = 'message error';
                    }
                } catch (error) {
                    console.error('❌ Connection Error during Login:', error);
                    loginMessage.innerHTML = 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + error.message;
                    loginMessage.className = 'message error';
                }
            });

            // 4. Populate Dropdown List
            async function getDropdownData() {
                console.log('🔄 Dropdown Load: เริ่มต้นดึงชื่อแก๊สจาก API');
                try {
                    const result = await callApi('getGasNames', {});
                    const gasNames = result.gasNames || []; 

                    gasTypeInput.innerHTML = '<option value="">เลือกประเภทแก๊ส</option>';

                    if (gasNames.length > 0) {
                        gasNames.forEach(name => {
                            const option = document.createElement('option');
                            option.value = name;
                            option.textContent = name;
                            gasTypeInput.appendChild(option);
                        });
                        console.log('✅ Dropdown Load: โหลดชื่อแก๊สสำเร็จ:', gasNames);
                    } else {
                        console.warn('⚠️ Dropdown Load: API ไม่คืนค่าชื่อแก๊สหรือคืนค่าว่าง');
                        const option = document.createElement('option');
                        option.textContent = 'ไม่พบข้อมูลแก๊ส';
                        gasTypeInput.appendChild(option);
                    }
                } catch (error) {
                    console.error('❌ Dropdown Load Failed:', error);
                    const option = document.createElement('option');
                    option.textContent = 'ไม่สามารถโหลดข้อมูลได้ (Error)';
                    gasTypeInput.appendChild(option);
                    gasTypeInput.disabled = true;
                }
            }
            
            // 7. Form Validation (real-time)
            const requiredInputs = [gasTypeInput, remainPressureInput];

            function checkFormValidity() {
                const allFilled = requiredInputs.every(input => input.value);
                // Check if at least one file is attached
                const filesAttached = selectedFiles.length > 0;

                const isFormValid = allFilled && filesAttached;

                submitBtn.disabled = !isFormValid;
                submitBtn.style.backgroundColor = isFormValid ? '#2c3e50' : '#bdc3c7';
            }
            requiredInputs.forEach(input => {
                input.addEventListener('input', checkFormValidity);
                input.addEventListener('change', checkFormValidity); 
            });


            // 8. Form Submission (File Upload)
            dataEntryForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                console.log('🚀 Submission Attempt: เริ่มต้นส่งข้อมูลฟอร์ม');

                submitBtn.disabled = true;
                submitMessage.textContent = 'กำลังส่งข้อมูล...';
                submitMessage.className = 'message';

                if (selectedFiles.length === 0) {
                    console.warn('⚠️ Submission Failed: ไม่พบไฟล์รูปภาพ');
                    submitMessage.textContent = 'กรุณาแนบรูปภาพอย่างน้อย 1 ไฟล์ก่อนส่งข้อมูล';
                    submitMessage.className = 'message error';
                    submitBtn.disabled = false;
                    return;
                }

                try {
                    const formData = new FormData();
                    
                    // แนบข้อมูลที่ไม่ใช่ไฟล์
                    formData.append('action', 'submitData');
                    formData.append('employeeId', employeeId);
                    formData.append('gasName', gasTypeInput.value);
                    formData.append('remainPressure', remainPressureInput.value);
                    
                    // แนบไฟล์ทั้งหมด
                    selectedFiles.forEach((file, index) => {
                         // Note: We use the same name 'photo' for all files. Google Apps Script handles this automatically.
                        formData.append('photo', file, file.name); 
                    });

                    // ส่งออบเจกต์ FormData ไปที่ API
                    const response = await fetch(API_URL, {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    if (result.status === 'success') {
                        console.log('✅ Submission Success: ข้อมูลบันทึกสำเร็จ');
                        submitMessage.textContent = 'บันทึกข้อมูลสำเร็จ!';
                        submitMessage.className = 'message success';
                        dataEntryForm.reset();
                        selectedFiles = []; // Clear the file array
                        renderFileList(); // Update UI
                    } else {
                        console.error('❌ Submission Failed (API):', result.message);
                        submitMessage.textContent = 'บันทึกข้อมูลไม่สำเร็จ: ' + (result.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
                        submitMessage.className = 'message error';
                    }
                } catch (error) {
                    console.error('❌ Submission Error:', error);
                    submitMessage.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message;
                    submitMessage.className = 'message error';
                }
                
                // คืนค่าปุ่มให้ใช้งานได้ หากการส่งไม่สำเร็จ
                if (submitMessage.className.includes('error')) {
                    checkFormValidity(); // ตรวจสอบอีกครั้งตามสถานะฟอร์ม
                }
            }); 
            
            // Cleanup on page unload (optional but good practice)
            window.addEventListener('beforeunload', () => {
                fileUrls.forEach(url => URL.revokeObjectURL(url));
            });
        });
