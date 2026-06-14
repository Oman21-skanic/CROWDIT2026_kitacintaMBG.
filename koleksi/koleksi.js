document.addEventListener('DOMContentLoaded', () => {
    renderKoleksi();

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.col-action') && !e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                dropdown.classList.add('hidden');
            });
        }
    });
});

function renderKoleksi() {
    const listContainer = document.getElementById('koleksiList');
    if (!listContainer) return;

    const data = localStorage.getItem('tenangin_koleksi');
    const koleksi = data ? JSON.parse(data) : [];

    if (koleksi.length === 0) {
        listContainer.innerHTML = '<div style="padding: 24px; text-align: center; color: #77A19B;">Belum ada koleksi foto.</div>';
        return;
    }

    listContainer.innerHTML = '';
    koleksi.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'koleksi-item';
        
        // Setup thumbnail
        let thumbHtml = '';
        if (item.type === 'Gambar' && item.data) {
            thumbHtml = `<img src="${item.data}" alt="${item.name}">`;
        } else {
            thumbHtml = '<i class="ph ph-image"></i>';
        }

        itemDiv.innerHTML = `
            <div class="col-nama">
                <div class="item-thumb">
                    ${thumbHtml}
                </div>
                <span class="truncate-name">${item.name}</span>
            </div>
            <div class="col-waktu">${item.date}</div>
            <div class="col-ukuran">${item.size}</div>
            <button class="col-action" onclick="toggleDropdown('${item.id}')">
                <i class="ph-fill ph-dots-three-outline-vertical"></i>
            </button>
            <div class="action-dropdown hidden" id="dropdown-${item.id}">
                <button class="delete-btn" onclick="deleteKoleksi('${item.id}')">
                    <i class="ph ph-trash"></i> Hapus
                </button>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });
}

function toggleDropdown(id) {
    // Hide all other dropdowns
    document.querySelectorAll('.action-dropdown').forEach(dropdown => {
        if (dropdown.id !== 'dropdown-' + id) {
            dropdown.classList.add('hidden');
        }
    });
    // Toggle current
    const dropdown = document.getElementById('dropdown-' + id);
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

function deleteKoleksi(id) {
    const data = localStorage.getItem('tenangin_koleksi');
    let koleksi = data ? JSON.parse(data) : [];
    
    koleksi = koleksi.filter(item => item.id !== id);
    localStorage.setItem('tenangin_koleksi', JSON.stringify(koleksi));
    
    renderKoleksi();
}

window.toggleDropdown = toggleDropdown;
window.deleteKoleksi = deleteKoleksi;
