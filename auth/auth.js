document.addEventListener("DOMContentLoaded", () => {
    // inisialisasi emailjs
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "gityrgmwReQzQjsMI"
        });
    }

    const checkbox = document.getElementById("terms-checkbox");
    const checkIcon = document.getElementById("checkbox-icon");
    
    if (checkbox && checkIcon) {
        checkbox.addEventListener("change", function() {
            if(this.checked) {
                checkIcon.classList.remove("hidden");
            } else {
                checkIcon.classList.add("hidden");
            }
        });
    }
    
    const textElement = document.getElementById('changing-text');
    if (textElement) {
        const phrases = [
            "Sedang memahami ceritamu...",
            "Sedang meresapi perasaanmu...",
            "Sedang mendengarkan dengan baik...",
            "Menyiapkan respons terbaik..."
        ];
        let currentIndex = 0;

        setInterval(() => {
            currentIndex = (currentIndex + 1) % phrases.length;
            textElement.style.opacity = 0;
            setTimeout(() => {
                textElement.textContent = phrases[currentIndex];
                textElement.style.opacity = 1;
                textElement.style.transition = "opacity 0.3s ease-in-out";
            }, 300);
        }, 3500);
    }

    // Toggle mata untuk input password utama
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeClosedIcon = document.getElementById('eyeClosedIcon');
    const eyeOpenIcon = document.getElementById('eyeOpenIcon');

    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            if (type === 'text') {
                if (eyeClosedIcon) eyeClosedIcon.classList.add('hidden');
                if (eyeOpenIcon) eyeOpenIcon.classList.remove('hidden');
            } else {
                if (eyeClosedIcon) eyeClosedIcon.classList.remove('hidden');
                if (eyeOpenIcon) eyeOpenIcon.classList.add('hidden');
            }
        });
    }

    // Toggle mata untuk input konfirmasi password
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmEyeClosedIcon = document.getElementById('confirmEyeClosedIcon');
    const confirmEyeOpenIcon = document.getElementById('confirmEyeOpenIcon');

    if (toggleConfirmPasswordBtn && confirmPasswordInput) {
        toggleConfirmPasswordBtn.addEventListener('click', () => {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            
            if (type === 'text') {
                if (confirmEyeClosedIcon) confirmEyeClosedIcon.classList.add('hidden');
                if (confirmEyeOpenIcon) confirmEyeOpenIcon.classList.remove('hidden');
            } else {
                if (confirmEyeClosedIcon) confirmEyeClosedIcon.classList.remove('hidden');
                if (confirmEyeOpenIcon) confirmEyeOpenIcon.classList.add('hidden');
            }
        });
    }

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // fungsi untuk mengubah style input dan placeholder saat error
    const toggleInputError = (inputId, showError, customMessage = "") => {
        const input = document.getElementById(inputId);
        if (!input) return;

        const wrapper = input.closest('.relative') || input.closest('.input-wrapper');

        if (showError) {
            if (wrapper) wrapper.classList.add('input-error-wrapper');
            input.classList.add('error-placeholder');
            
            // simpan placeholder asli
            if (!input.hasAttribute('data-original-placeholder')) {
                input.setAttribute('data-original-placeholder', input.getAttribute('placeholder'));
            }
            
            // kosongkan value dan ubah placeholder
            input.value = ""; 
            input.setAttribute('placeholder', customMessage);
        } else {
            if (wrapper) wrapper.classList.remove('input-error-wrapper');
            input.classList.remove('error-placeholder');
            
            // kembalikan placeholder ke awal
            if (input.hasAttribute('data-original-placeholder')) {
                input.setAttribute('placeholder', input.getAttribute('data-original-placeholder'));
            }
        }
    };

    // fungsi khusus untuk checkbox error
    const toggleCheckboxError = (checkboxId, showError) => {
        const label = document.querySelector(`label[for="${checkboxId}"]`);
        if (showError) {
            if (label) label.style.color = '#FF5656';
        } else {
            if (label) label.style.color = '';
        }
    };

    // saat user mulai mengetik, kembalikan tampilan dari merah ke normal
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('error-placeholder')) {
                toggleInputError(this.id, false);
            }
            if (this.type === 'checkbox') {
                toggleCheckboxError(this.id, false);
            }
        });
    });

    // register
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault(); 

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const terms = document.getElementById('terms-checkbox').checked;

            let hasError = false;

            if (!name) { toggleInputError('name', true, 'Nama lengkap wajib diisi...'); hasError = true; } 
            else { toggleInputError('name', false); }

            if (!isValidEmail(email)) { toggleInputError('email', true, 'Format alamat email tidak sesuai...'); hasError = true; } 
            else { toggleInputError('email', false); }

            if (password.length < 8) { toggleInputError('password', true, 'Sandi harus minimal 8 karakter...'); hasError = true; } 
            else { toggleInputError('password', false); }

            if (password !== confirmPassword || !confirmPassword) { toggleInputError('confirmPassword', true, 'Konfirmasi sandi tidak cocok...'); hasError = true; } 
            else { toggleInputError('confirmPassword', false); }

            if (!terms) { toggleCheckboxError('terms-checkbox', true); hasError = true; } 
            else { toggleCheckboxError('terms-checkbox', false); }

            if (hasError) return;

            let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
            const isEmailExist = users.find(u => u.email === email);
            
            if (isEmailExist) {
                toggleInputError('email', true, 'Email ini sudah terdaftar...');
                return;
            }

            const newUser = { name, email, password };
            users.push(newUser);
            localStorage.setItem('tenangin_users', JSON.stringify(users));
            localStorage.setItem('tenangin_active_user', JSON.stringify(newUser));
            window.location.href = "../index.html"; 
        });
    }

    // login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            let hasError = false;

            if (!isValidEmail(email)) { toggleInputError('email', true, 'Format alamat email tidak sesuai...'); hasError = true; } 
            else { toggleInputError('email', false); }

            if (!password) { toggleInputError('password', true, 'Sandi belum diisi...'); hasError = true; } 
            else { toggleInputError('password', false); }

            if (hasError) return;

            let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
            const user = users.find(u => u.email === email);

            if (!user) {
                toggleInputError('email', true, 'Email tidak terdaftar...');
                return;
            }

            if (user.password !== password) {
                toggleInputError('password', true, 'Sandi yang dimasukkan salah...');
                return;
            }

            localStorage.setItem('tenangin_active_user', JSON.stringify(user));
            window.location.href = "../index.html"; 
        });
    }

    const forgotForm = document.getElementById('forgot-form');
    const verifyForm = document.getElementById('otp-form');
    const otpInputs = document.querySelectorAll('.otp-input');
    
    // otomatis pindah kolom saat isi otp
    if (otpInputs.length > 0) {
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, ''); 
                if (e.target.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });
    }

    // fungsi kirim otp pakai emailjs
    const sendOTP = (emailTarget, buttonElement) => {
        const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        localStorage.setItem('tenangin_reset_code', randomCode);
        localStorage.setItem('tenangin_reset_email', emailTarget);

        const originalText = buttonElement.innerText;
        buttonElement.innerText = "Mengirim...";
        buttonElement.disabled = true;

        emailjs.send("service_ko6ocum", "template_j7by4c5", {
            to_email: emailTarget,
            otp_code: randomCode,
        })
        .then(() => {
            document.getElementById('step-1').classList.add('hidden');
            document.getElementById('step-2').classList.remove('hidden');
            
            const displayEmail = document.getElementById('display-email');
            if(displayEmail) displayEmail.innerText = emailTarget;

            setTimeout(() => {
                if(otpInputs.length > 0) otpInputs[0].focus();
            }, 100);
        })
        .catch((err) => {
            let detailError = err.text || err.message || JSON.stringify(err);
            alert("Gagal mengirim email!\nError: " + detailError);
            console.error("error emailjs:", err);
        })
        .finally(() => {
            buttonElement.innerText = originalText;
            buttonElement.disabled = false;
        });
    };

    // penanganan form kirim otp
    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value.trim();
            const btnSubmit = forgotForm.querySelector('button[type="submit"]');

            if (!isValidEmail(email)) { 
                toggleInputError('reset-email', true, 'Format alamat email tidak sesuai...'); 
                return; 
            }

            let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
            const user = users.find(u => u.email === email);
            
            if (!user) {
                toggleInputError('reset-email', true, 'Email tidak terdaftar...');
                return; 
            }

            sendOTP(email, btnSubmit);
        });
    }

    // penanganan kirim ulang
    const resendBtn = document.getElementById('resend-code');
    if (resendBtn) {
        resendBtn.addEventListener('click', () => {
            const email = localStorage.getItem('tenangin_reset_email');
            if(email) {
                sendOTP(email, resendBtn);
            }
        });
    }

    // penanganan form verifikasi
    if (verifyForm) {
        verifyForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let enteredCode = "";
            otpInputs.forEach(input => enteredCode += input.value);
            
            const savedCode = localStorage.getItem('tenangin_reset_code');
            const savedEmail = localStorage.getItem('tenangin_reset_email');
            const errorMsg = document.getElementById('otp-error');

            if (enteredCode === savedCode && savedCode !== null) {
                errorMsg.classList.add('hidden');
                
                let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
                const user = users.find(u => u.email === savedEmail);
                if (user) {
                    localStorage.setItem('tenangin_active_user', JSON.stringify(user));
                }

                localStorage.removeItem('tenangin_reset_code');
                localStorage.removeItem('tenangin_reset_email');

                document.getElementById('step-2').classList.add('hidden');
                document.getElementById('step-3').classList.remove('hidden');

                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1500);
            } else {
                errorMsg.classList.remove('hidden');
                otpInputs.forEach(input => {
                    input.classList.add('border-[#FF5656]');
                    setTimeout(() => input.classList.remove('border-[#FF5656]'), 2000);
                });
            }
        });
    }

    // ====================================================================
    // INTEGRASI GOOGLE LOGIN (Menyimpan Data via Local Storage)
    // ====================================================================
    
    const handleGoogleLoginSuccess = (userInfo) => {
        let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
        let user = users.find(u => u.email === userInfo.email);
        
        if (!user) {
            user = { 
                name: userInfo.name, 
                email: userInfo.email, 
                password: '', 
                isGoogleAuth: true 
            };
            users.push(user);
            localStorage.setItem('tenangin_users', JSON.stringify(users));
        }
        
        localStorage.setItem('tenangin_active_user', JSON.stringify(user));
        window.location.href = "../index.html";
    };

    let tokenClient; 

    const initGoogleAuth = () => {
        if (typeof google === 'undefined' || !google.accounts) {
            setTimeout(initGoogleAuth, 100);
            return;
        }
        
        const googleBtns = document.querySelectorAll('.btn-google');
        if (googleBtns.length === 0) return;

        // Menggunakan Client ID asli yang baru saja kamu buat
        const GOOGLE_CLIENT_ID = '11895252258-u98sldkcra1ueshfr6puae7dcpem7aek.apps.googleusercontent.com'; 

        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                    })
                    .then(res => res.json())
                    .then(userInfo => {
                        handleGoogleLoginSuccess(userInfo);
                    })
                    .catch(err => {
                        console.error('Gagal fetch data Google:', err);
                        alert('Gagal mengambil data dari Google.');
                    });
                }
            },
        });

        googleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if(tokenClient) {
                    tokenClient.requestAccessToken();
                } else {
                    alert("Sistem Google sedang memuat, silakan coba lagi sebentar.");
                }
            });
        });
    };

    initGoogleAuth();
});