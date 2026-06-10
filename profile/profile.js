document.addEventListener("DOMContentLoaded", () => {
    //cek sesi user 
    let activeUser = JSON.parse(localStorage.getItem('tenangin_active_user'));

    if (!activeUser) {
        window.location.href = '../auth/login.html';
        return;
    }

    const profileHeadingName = document.getElementById('profile-heading-name');
    const profileAvatar = document.getElementById('profile-avatar');
    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    const inputFileAvatar = document.getElementById('input-file-avatar');

    const inputNama = document.getElementById('input-nama');
    const inputEmail = document.getElementById('input-email');
    const inputTanggalLahir = document.getElementById('input-tanggal-lahir');
    const inputTelepon = document.getElementById('input-telepon');

    const btnDelete = document.getElementById('btn-delete-account');
    const btnLogout = document.getElementById('btn-logout');

    let tempAvatarData = activeUser.avatarDataUrl || null;

    function loadUserDataToUI() {
        profileHeadingName.textContent = activeUser.name;
        inputNama.value = activeUser.name;
        inputEmail.value = activeUser.email;
        if (activeUser.tanggalLahir) inputTanggalLahir.value = activeUser.tanggalLahir;
        if (activeUser.telepon) inputTelepon.value = activeUser.telepon;

        if (activeUser.avatarDataUrl) {
            profileAvatar.src = activeUser.avatarDataUrl;
        }
    }
    loadUserDataToUI();

    // fungsi auto save profile setiap ada perubahan input
    function autoSaveProfile() {
        activeUser.name = inputNama.value.trim() || "Tanpa Nama";
        activeUser.tanggalLahir = inputTanggalLahir.value;
        activeUser.telepon = inputTelepon.value.trim();
        activeUser.avatarDataUrl = tempAvatarData;

        // simpan langsung ke session aktif
        localStorage.setItem('tenangin_active_user', JSON.stringify(activeUser));

        // update juga ke database users array
        let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
        const userIndex = users.findIndex(u => u.email === activeUser.email);
        
        if (userIndex !== -1) {
            users[userIndex] = activeUser;
            localStorage.setItem('tenangin_users', JSON.stringify(users));
        }

        // update UI nama secara realtime
        profileHeadingName.textContent = activeUser.name;
    }

    // trigger auto save ketika user mengetik atau mengubah input
    inputNama.addEventListener('input', autoSaveProfile);
    inputTanggalLahir.addEventListener('change', autoSaveProfile);
    inputTelepon.addEventListener('input', autoSaveProfile);

    const customModal = document.getElementById('custom-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButtonsContainer = document.getElementById('modal-buttons');
    const modalIcon = document.getElementById('modal-icon');
    const btnModalClose = document.getElementById('modal-close');

    function showAlert(title, message, buttons, type = 'info') {
        modalTitle.textContent = title;
        modalMessage.innerHTML = message; 
        modalButtonsContainer.innerHTML = '';

        if (type === 'danger') {
            modalTitle.className = "font-bold text-[20px] text-[#D31313] tracking-tight mb-1";
            modalMessage.className = "text-[13px] text-[#A66E6E] leading-snug mb-6 px-1";
            modalIcon.innerHTML = `<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#D31313" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
            modalIcon.style.display = 'block';
        } else {
            modalTitle.className = "font-bold text-[20px] text-[#0C3932] tracking-tight mb-1";
            modalMessage.className = "text-[13px] text-gray-500 leading-snug mb-6 px-1";
            modalIcon.style.display = 'none';
        }

        buttons.forEach((btn) => {
            const buttonEl = document.createElement('button');
            buttonEl.textContent = btn.text;
        
            if (btn.style === 'danger') {
                buttonEl.className = "flex-1 bg-[#D31313] text-white py-2.5 rounded-lg text-[14px] font-medium hover:bg-red-700 transition-colors focus:outline-none";
            } else if (btn.style === 'cancel') {
                buttonEl.className = "flex-1 bg-[#CDD4D8] text-gray-600 py-2.5 rounded-lg text-[14px] font-medium hover:bg-gray-400 hover:text-white transition-colors focus:outline-none";
            } else {
                buttonEl.className = "flex-1 bg-[#0D4F45] text-white py-2.5 rounded-lg text-[14px] font-medium hover:bg-[#0e4139] transition-colors focus:outline-none";
            }
            
            buttonEl.addEventListener('click', () => {
                closeAlert();
                if (btn.onClick) btn.onClick();
            });

            modalButtonsContainer.appendChild(buttonEl);
        });

        customModal.classList.add('modal-active');
    }

    function closeAlert() {
        customModal.classList.remove('modal-active');
    }

    btnModalClose.addEventListener('click', closeAlert);

    // ganti profile dan auto save ketika user pilih file baru
    btnEditAvatar.addEventListener('click', () => {
        inputFileAvatar.click();
    });

    inputFileAvatar.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showAlert("Format Salah", "Pilih file berupa gambar (JPG, PNG).", [{ text: "Oke" }]);
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                tempAvatarData = event.target.result;
                profileAvatar.src = tempAvatarData; 
                autoSaveProfile(); 
            };
            reader.readAsDataURL(file);
        }
    });

    // tombol hapus akun dengan konfirmasi (Figma-based modal)
    const deleteModal = document.getElementById('delete-modal');
    const deleteModalClose = document.getElementById('delete-modal-close');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');

    function showDeleteModal() {
        deleteModal.classList.add('active');
    }

    function hideDeleteModal() {
        deleteModal.classList.remove('active');
    }

    btnDelete.addEventListener('click', showDeleteModal);

    deleteModalClose.addEventListener('click', hideDeleteModal);
    btnCancelDelete.addEventListener('click', hideDeleteModal);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) hideDeleteModal();
    });

    btnConfirmDelete.addEventListener('click', () => {
        let users = JSON.parse(localStorage.getItem('tenangin_users')) || [];
        users = users.filter(u => u.email !== activeUser.email);
        localStorage.setItem('tenangin_users', JSON.stringify(users));
        localStorage.removeItem('tenangin_active_user');
        window.location.href = "../auth/login.html";
    });

    // tombol logout dengan konfirmasi (Figma-based modal)
    const logoutModal = document.getElementById('logout-modal');
    const logoutModalClose = document.getElementById('logout-modal-close');
    const btnConfirmLogout = document.getElementById('btn-confirm-logout');
    const btnCancelLogout = document.getElementById('btn-cancel-logout');

    function showLogoutModal() {
        logoutModal.classList.add('active');
    }

    function hideLogoutModal() {
        logoutModal.classList.remove('active');
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', showLogoutModal);
    }

    logoutModalClose.addEventListener('click', hideLogoutModal);
    btnCancelLogout.addEventListener('click', hideLogoutModal);
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) hideLogoutModal();
    });

    btnConfirmLogout.addEventListener('click', () => {
        localStorage.removeItem('tenangin_active_user');
        window.location.href = "../auth/login.html";
    });

});