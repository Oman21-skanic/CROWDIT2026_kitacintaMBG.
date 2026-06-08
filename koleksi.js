document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.koleksi-search input');
    const items = document.querySelectorAll('.koleksi-item');

    // Pencarian
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            items.forEach(item => {
                const nameSpan = item.querySelector('.col-nama span');
                if (nameSpan) {
                    const name = nameSpan.textContent.toLowerCase();
                    if (name.includes(query)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    }

    // Klik Item (Simulasi Buka/Unduh File)
    items.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const name = item.querySelector('.col-nama span').textContent;
            alert(`File "${name}" sedang dibuka/diunduh...`);
        });
    });

    // Filter Kategori (Semua, Gambar, File)
    const pills = document.querySelectorAll('.filter-bar .pill');
    if (pills.length > 0) {
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Hapus kelas active dari semua tombol
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const filterType = pill.textContent.toLowerCase();
                
                // Jika sedang menggunakan pencarian, kita terapkan kedua filter
                const currentSearchQuery = searchInput ? searchInput.value.toLowerCase() : '';

                items.forEach(item => {
                    const iconElement = item.querySelector('.item-thumb i');
                    const iconClass = iconElement ? iconElement.className : '';
                    
                    const nameSpan = item.querySelector('.col-nama span');
                    const name = nameSpan ? nameSpan.textContent.toLowerCase() : '';
                    
                    const matchesSearch = name.includes(currentSearchQuery);
                    
                    let matchesCategory = false;
                    if (filterType === 'semua') {
                        matchesCategory = true;
                    } else if (filterType === 'gambar') {
                        matchesCategory = iconClass.includes('image');
                    } else if (filterType === 'file') {
                        // Anggap yang bukan image adalah file (atau punya ph-file)
                        matchesCategory = !iconClass.includes('image');
                    }
                    
                    if (matchesSearch && matchesCategory) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
});

    // Logika Dropdown Hapus
    const actionBtns = document.querySelectorAll('.col-action');
    
    // Buka/Tutup dropdown saat titik tiga diklik
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event click item utama terpanggil
            
            // Tutup semua dropdown lain dulu
            document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                if(dropdown !== btn.nextElementSibling) {
                    dropdown.classList.add('hidden');
                }
            });
            
            // Toggle dropdown ini
            const dropdown = btn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('action-dropdown')) {
                dropdown.classList.toggle('hidden');
            }
        });
    });
    
    // Tutup dropdown jika klik di luar
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            dropdown.classList.add('hidden');
        });
    });
    
    // Hapus Item
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah item click
            const item = btn.closest('.koleksi-item');
            if (item) {
                // Animasi kecil sebelum dihapus
                item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                item.style.opacity = "0";
                item.style.transform = "translateX(20px)";
                setTimeout(() => {
                    item.remove();
                }, 300);
            }
        });
    });
