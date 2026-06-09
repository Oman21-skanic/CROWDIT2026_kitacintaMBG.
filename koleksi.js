document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.querySelector('.koleksi-search input');
    const koleksiList = document.getElementById('koleksiList');
    const pills = document.querySelectorAll('.filter-bar .pill');
    
    function loadKoleksi() {
        if (!koleksiList) return;
        const data = localStorage.getItem('tenangin_koleksi');
        const koleksi = data ? JSON.parse(data) : [];
        
        koleksiList.innerHTML = '';
        
        if (koleksi.length === 0) {
            koleksiList.innerHTML = '<div style="padding: 20px; text-align: center; color: #5E938B;">Belum ada koleksi yang disimpan.</div>';
            return;
        }

        koleksi.forEach(item => {
            const isImage = item.type.toLowerCase().includes('gambar');
            const imgSrc = isImage && item.data ? item.data : '';
            const thumbHtml = isImage && imgSrc ? 
                `<img src="${imgSrc}" style="object-fit: cover; width: 100%; height: 100%;" alt="thumb">` : 
                `<i class="ph ph-file-text"></i>`;

            const div = document.createElement('div');
            div.className = 'koleksi-item';
            div.dataset.id = item.id;
            div.innerHTML = `
                <div class="col-nama">
                    <div class="item-thumb">${thumbHtml}</div>
                    <span class="truncate-name">${item.name}</span>
                </div>
                <span class="col-waktu">${item.date}</span>
                <span class="col-ukuran">${item.size}</span>
                <button class="col-action"><i class="ph ph-dots-three-vertical"></i></button>
                <div class="action-dropdown hidden">
                    <button class="delete-btn">
                        <i class="ph ph-trash"></i> Hapus
                    </button>
                </div>
            `;
            
            koleksiList.appendChild(div);
        });

        attachEvents();
    }

    function attachEvents() {
        const items = document.querySelectorAll('.koleksi-item');

        // Klik Item (Simulasi Buka/Unduh File)
        items.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const name = item.querySelector('.col-nama span').textContent;
                alert(`File "${name}" sedang dibuka/diunduh...`);
            });
        });

        // Logika Dropdown Hapus
        const actionBtns = document.querySelectorAll('.col-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                document.querySelectorAll('.action-dropdown').forEach(dropdown => {
                    if(dropdown !== btn.nextElementSibling) {
                        dropdown.classList.add('hidden');
                    }
                });
                
                const dropdown = btn.nextElementSibling;
                if (dropdown && dropdown.classList.contains('action-dropdown')) {
                    dropdown.classList.toggle('hidden');
                }
            });
        });

        // Hapus Item
        const deleteBtns = document.querySelectorAll('.delete-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.koleksi-item');
                if (item) {
                    const id = item.dataset.id;
                    const data = localStorage.getItem('tenangin_koleksi');
                    if (data) {
                        let koleksi = JSON.parse(data);
                        koleksi = koleksi.filter(k => k.id !== id);
                        localStorage.setItem('tenangin_koleksi', JSON.stringify(koleksi));
                    }
                    
                    item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                    item.style.opacity = "0";
                    item.style.transform = "translateX(20px)";
                    setTimeout(() => {
                        item.remove();
                        if (document.querySelectorAll('.koleksi-item').length === 0) {
                            loadKoleksi();
                        }
                    }, 300);
                }
            });
        });
    }

    // Tutup dropdown jika klik di luar
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown').forEach(dropdown => {
            dropdown.classList.add('hidden');
        });
    });

    // Pencarian
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.koleksi-item');
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

    // Filter Kategori
    if (pills.length > 0) {
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const filterType = pill.textContent.toLowerCase();
                const currentSearchQuery = searchInput ? searchInput.value.toLowerCase() : '';
                const items = document.querySelectorAll('.koleksi-item');

                items.forEach(item => {
                    const thumbHtml = item.querySelector('.item-thumb').innerHTML;
                    const isImage = thumbHtml.includes('<img');
                    
                    const nameSpan = item.querySelector('.col-nama span');
                    const name = nameSpan ? nameSpan.textContent.toLowerCase() : '';
                    
                    const matchesSearch = name.includes(currentSearchQuery);
                    
                    let matchesCategory = false;
                    if (filterType === 'semua') {
                        matchesCategory = true;
                    } else if (filterType === 'gambar') {
                        matchesCategory = isImage;
                    } else if (filterType === 'file') {
                        matchesCategory = !isImage;
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

    // Initial Load
    loadKoleksi();
});
