// --- LOCAL STORAGE HELPERS ---
function getConversations() {
    const data = localStorage.getItem('tenangin_conversations');
    return data ? JSON.parse(data) : [];
}

function saveConversations(convs) {
    localStorage.setItem('tenangin_conversations', JSON.stringify(convs));
}

function getActiveChatId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('chatId');
}

function renderSidebarHistory() {
    const historyLists = document.querySelectorAll('.history-list');
    if (historyLists.length === 0) return;
    
    const convs = getConversations();
    historyLists.forEach(list => {
        list.innerHTML = '';
        if (convs.length === 0) {
            list.innerHTML = '<div class="history-item" style="opacity: 0.5;">Belum ada riwayat</div>';
            return;
        }
        convs.forEach(conv => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.textContent = conv.title;
            div.dataset.id = conv.id;
            div.style.cursor = 'pointer';
            list.appendChild(div);
        });
    });
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION CHECK ---
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login.html') && !currentPath.includes('register.html') && !currentPath.includes('forgot-password.html')) {
        const activeUserStr = localStorage.getItem('tenangin_active_user');
        if (activeUserStr) {
            try {
                const activeUser = JSON.parse(activeUserStr);
                const nameEls = document.querySelectorAll('.user-profile-info h3');
                const emailEls = document.querySelectorAll('.user-profile-info span');
                const imgEls = document.querySelectorAll('.user-profile-footer img');

                nameEls.forEach(el => el.textContent = activeUser.name);
                emailEls.forEach(el => el.textContent = activeUser.email);
                imgEls.forEach(el => {
                    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.name)}&background=E5E5E5&color=000&size=40`;
                    el.alt = activeUser.name;
                });

                const profileBtns = document.querySelectorAll('.user-profile-footer, .mobile-header-profile, .header-action');
                profileBtns.forEach(btn => {
                    btn.style.cursor = 'pointer';
                    btn.addEventListener('click', () => {
                        window.location.href = 'features/profile/profile.html';
                    });
                });
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }

    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');

    const fileUploadInput = document.getElementById('fileUploadInput');
    const addBtn = document.getElementById('addBtn');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const imageName = document.getElementById('imageName');
    const removeImageBtn = document.getElementById('removeImageBtn');

    let currentImageBase64 = null;
    let currentImageMime = null;
    let currentImageFile = null;

    // === GEMINI API SETUP ===
    const GEMINI_API_KEY = 'AQ.Ab8RN6LHvIEOWri0UsNZ4LrMfA_4nST4er_ZL2Lopa7h0EIYcQ'; 
    
    // System instruction untuk persona Psikiater Pribadi
    const SYSTEM_PROMPT = `Anda adalah seorang psikiater pribadi dan konselor empati yang sangat ramah, suportif, dan menjadi pendengar yang baik. 
Tugas Anda adalah mendengarkan curhatan atau masalah pribadi pengguna, memberikan tanggapan yang menenangkan, tidak menghakimi, dan memvalidasi perasaan mereka. 
Gunakan bahasa Indonesia yang hangat, santai tapi sopan. Hindari menggunakan bahasa kaku.
Berikan saran psikologis ringan jika dirasa perlu, namun fokus utama adalah membuat pengguna merasa didengarkan dan dimengerti. 
Berikan respons yang singkat, padat, dan tidak terlalu panjang. Jika pengguna mengirimkan gambar, perhatikan gambar tersebut untuk membantu mengerti konteks perasaan mereka.
Ingat, jika pengguna baru menyapa, sapa balik dengan sangat ramah dan tanyakan apa yang sedang mereka rasakan.`;

    let conversationHistory = [];
    let currentConversationId = getActiveChatId();
    let currentTitle = "Obrolan Baru";

    // Load active conversation if exists
    if (currentConversationId) {
        const convs = getConversations();
        const activeConv = convs.find(c => c.id === currentConversationId);
        if (activeConv) {
            currentTitle = activeConv.title;
            activeConv.messages.forEach(msg => {
                addMessage(msg.text, msg.role === 'user', false, false, msg.time, msg.imageBase64, msg.imageMime);
                let parts = [{ text: msg.text }];
                if (msg.imageBase64 && msg.imageMime) {
                    parts.unshift({ inlineData: { mimeType: msg.imageMime, data: msg.imageBase64 } });
                }
                conversationHistory.push({ role: msg.role, parts: parts });
            });
        } else {
            currentConversationId = null;
        }
    }

    renderSidebarHistory();

    function formatTextToHTML(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function addMessage(text, isSent = true, saveToHistory = false, animateTyping = false, customTime = null, imageBase64 = null, imageMime = null) {
        if (!text && !imageBase64) return;
        if (!chatMessages) return;

        const now = new Date();
        const timeString = customTime || now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const messageWrapper = document.createElement('div');
        messageWrapper.className = "message-wrapper " + (isSent ? 'sent' : 'received') + " animate-in";

        messageWrapper.innerHTML = `
            <div class="message">
                <div class="bubble">
                    ${imageBase64 ? `<img src="data:${imageMime};base64,${imageBase64}" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px; display: block;">` : ''}
                    <p class="message-content"></p>
                    <span class="time">${timeString}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const p = messageWrapper.querySelector('.message-content');
        
        if (animateTyping && !isSent && text) {
            let i = 0;
            let tempText = "";
            const interval = setInterval(() => {
                tempText += text.charAt(i);
                p.textContent = tempText;
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (i >= text.length) {
                    clearInterval(interval);
                    p.innerHTML = formatTextToHTML(text);
                }
            }, 20);
        } else if (text) {
            p.innerHTML = formatTextToHTML(text);
        }

        if (saveToHistory) {
            let parts = [{ text: text }];
            if (imageBase64 && imageMime) {
                parts.unshift({ inlineData: { mimeType: imageMime, data: imageBase64 } });
            }
            conversationHistory.push({
                role: isSent ? "user" : "model",
                parts: parts
            });

            // Save to LocalStorage
            let convs = getConversations();
            if (!currentConversationId) {
                currentConversationId = 'conv_' + Date.now();
                currentTitle = isSent ? (text.length > 30 ? text.substring(0, 30) + '...' : text) : "Obrolan Baru";
                const newConv = {
                    id: currentConversationId,
                    title: currentTitle,
                    date: now.toISOString(),
                    messages: []
                };
                convs.unshift(newConv);
                
                // Update URL
                const url = new URL(window.location);
                url.searchParams.set('chatId', currentConversationId);
                window.history.replaceState({}, '', url);
            } else if (isSent && currentTitle === "Obrolan Baru" && text) {
                currentTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
                const activeConv = convs.find(c => c.id === currentConversationId);
                if (activeConv) {
                    activeConv.title = currentTitle;
                }
            }
            
            const activeConv = convs.find(c => c.id === currentConversationId);
            if (activeConv) {
                activeConv.messages.push({
                    role: isSent ? "user" : "model",
                    text: text,
                    time: timeString,
                    timestamp: now.getTime(),
                    imageBase64: imageBase64,
                    imageMime: imageMime
                });
                saveConversations(convs);
                renderSidebarHistory();
            }
        }
    }

    function setBotStatus(text) {
        const botStatusText = document.getElementById('botStatusText');
        const typingIndicatorText = document.getElementById('typingIndicatorText');

        if (botStatusText && botStatusText.textContent !== text) {
            botStatusText.classList.add('fade-out');
            setTimeout(() => {
                botStatusText.textContent = text;
                botStatusText.classList.remove('fade-out');
            }, 300);
        }

        if (typingIndicatorText) {
            typingIndicatorText.textContent = text;
        }
    }

    function showTypingIndicator() {
        if (!chatMessages) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'message-wrapper received';
        wrapper.id = 'typingIndicator';
        
        wrapper.innerHTML = `
            <div class="message">
                <div class="typing-indicator" style="gap: 12px; background: transparent; border: none; box-shadow: none; padding: 0;">
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span id="typingIndicatorText" style="font-size: 14px; color: #44726B; font-style: italic; white-space: nowrap;">meresapi ceritamu...</span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
        setBotStatus('siap mendengarkan');
    }

    async function generateResponse(userMessage) {
        if (!GEMINI_API_KEY) {
            hideTypingIndicator();
            addMessage("Halo! API Key belum diset.", false, false);
            return;
        }

        try {
            const payload = {
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: conversationHistory
            };

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const aiResponseText = data.candidates[0].content.parts[0].text;
            
            hideTypingIndicator();
            addMessage(aiResponseText, false, true, true); 
        } catch (error) {
            console.error("Gemini API Error:", error);
            hideTypingIndicator();
            addMessage("Maaf ya, koneksi terganggu. Boleh coba lagi?", false, false, true);
        }
    }

    if (addBtn && fileUploadInput) {
        addBtn.addEventListener('click', () => fileUploadInput.click());
        fileUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert("Hanya format gambar yang didukung untuk saat ini.");
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                currentImageBase64 = event.target.result.split(',')[1];
                currentImageMime = file.type;
                currentImageFile = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    data: event.target.result
                };
                
                if (imagePreviewContainer && imagePreview && imageName) {
                    imagePreview.src = event.target.result;
                    imageName.textContent = file.name;
                    imagePreviewContainer.style.display = 'flex';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            currentImageBase64 = null;
            currentImageMime = null;
            currentImageFile = null;
            fileUploadInput.value = '';
            if (imagePreviewContainer) {
                imagePreviewContainer.style.display = 'none';
            }
        });
    }

    async function handleSend() {
        const activeUserStr = localStorage.getItem('tenangin_active_user');
        if (!activeUserStr) {
            const authModal = document.getElementById('authModal');
            if (authModal) authModal.classList.add('active');
            return;
        }

        if(!messageInput) return;
        const text = messageInput.value.trim();
        if (!text && !currentImageBase64) return;

        const sentBase64 = currentImageBase64;
        const sentMime = currentImageMime;

        if (currentImageFile) {
            const koleksiData = localStorage.getItem('tenangin_koleksi');
            const koleksi = koleksiData ? JSON.parse(koleksiData) : [];
            const now = new Date();
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dateStr = `${now.getDate()} ${months[now.getMonth()]}`;
            
            koleksi.unshift({
                id: 'koleksi_' + Date.now(),
                name: currentImageFile.name,
                type: 'Gambar',
                size: (currentImageFile.size / 1024).toFixed(2) + ' KB',
                date: dateStr,
                data: currentImageFile.data
            });
            localStorage.setItem('tenangin_koleksi', JSON.stringify(koleksi));
        }

        addMessage(text, true, true, false, null, sentBase64, sentMime);
        messageInput.value = '';
        
        if (removeImageBtn) removeImageBtn.click();

        showTypingIndicator();
        setBotStatus('meresapi ceritamu...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setBotStatus('mencari tanggapan terbaik...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setBotStatus('sedang mengetik...');
        generateResponse(text);
    }

    // Auth Modal Close Logic
    const authModal = document.getElementById('authModal');
    const authModalBackdrop = document.getElementById('authModalBackdrop');
    
    if (authModalBackdrop) {
        authModalBackdrop.addEventListener('click', () => {
            if (authModal) authModal.classList.remove('active');
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
        }
    });

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSend);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSend();
            }
        });
    }

    // AI Initial Greeting Logic
    setTimeout(() => {
        if (chatMessages && !currentConversationId) {
            const hasMessages = chatMessages.querySelectorAll('.message-wrapper').length > 0;
            if (!hasMessages) {
                const greetings = [
                    "Halo! Aku Tenangin AI, teman ngobrolmu hari ini. Ada yang membebani pikiranmu?",
                    "Hai, selamat datang! Gimana kabarmu hari ini? Aku siap mendengarkan cerita apapun darimu.",
                    "Halo! Aku di sini untuk mendengarkan. Ada sesuatu yang ingin kamu ceritakan atau luapkan?",
                    "Hai! Kadang bercerita bisa membuat perasaan jadi lebih lega. Mau mulai dari mana?",
                    "Halo, aku Tenangin AI. Aku siap menjadi pendengar yang baik untukmu hari ini. Ada yang bisa aku bantu?"
                ];
                const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                
                showTypingIndicator();
                setBotStatus('sedang mengetik...');
                setTimeout(() => {
                    hideTypingIndicator();
                    addMessage(randomGreeting, false, true, true);
                }, 1500);
            }
        }
    }, 500);

    // Sidebar collapse functionality (Desktop vs Mobile)
    const collapseBtn = document.getElementById('collapseBtn');
    const sidebar = document.getElementById('sidebar');

    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                // Mobile: Close the drawer
                document.body.classList.remove('sidebar-open');
            } else {
                // Desktop: Toggle mini-sidebar mode
                document.body.classList.toggle('sidebar-collapsed');
            }
        });
    }

    // History Dropdown Toggle
    const historyDropdown = document.getElementById('historyDropdown');
    const historyList = document.getElementById('historyList');
    const historyCaret = document.getElementById('historyCaret');

    if (historyDropdown && historyList && historyCaret) {
        historyDropdown.addEventListener('click', () => {
            historyList.classList.toggle('collapsed');
            historyCaret.style.transform = historyList.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(90deg)';
            historyCaret.style.transition = 'transform 0.3s ease';
        });
    }

    // Animated Placeholder Logic
    const placeholderTemplates = [
        "Tulis perasaanmu di sini...",
        "Ceritakan apa yang membuatmu gelisah...",
        "Ada hal yang membebani pikiranmu?",
        "Aku siap mendengarkan ceritamu..."
    ];

    let placeholderIdx = 0;
    let charIdx = 0;
    let isDeletingPlaceholder = false;
    let typingDelay = 100;

    function typePlaceholder() {
        if (!messageInput) return;
        
        if (document.activeElement === messageInput || messageInput.value.length > 0) {
            messageInput.setAttribute('placeholder', 'Tulis pesan...');
            setTimeout(typePlaceholder, 2000);
            return;
        }

        const currentText = placeholderTemplates[placeholderIdx];
        
        if (isDeletingPlaceholder) {
            charIdx--;
            typingDelay = 30;
        } else {
            charIdx++;
            typingDelay = 60;
        }

        messageInput.setAttribute('placeholder', currentText.substring(0, charIdx));

        if (!isDeletingPlaceholder && charIdx === currentText.length) {
            typingDelay = 3000;
            isDeletingPlaceholder = true;
        } else if (isDeletingPlaceholder && charIdx === 0) {
            isDeletingPlaceholder = false;
            placeholderIdx = (placeholderIdx + 1) % placeholderTemplates.length;
            typingDelay = 500;
        }

        setTimeout(typePlaceholder, typingDelay);
    }
    
    if (messageInput) {
        setTimeout(typePlaceholder, 1000);
    }

    // Suggestion Chips Logic
    const chipTemplates = [
        "Aku merasa cemas", "Aku sedang stres", "Aku hanya ingin ngobrol", 
        "Aku ingin bercerita", "Pikiranku sedang kacau"
    ];

    const suggestionChips = document.querySelectorAll('.chip');
    if (suggestionChips.length > 0 && messageInput && sendBtn) {
        suggestionChips.forEach((chip, index) => {
            if (chipTemplates[index]) {
                chip.textContent = chipTemplates[index];
            }
            chip.addEventListener('click', () => {
                messageInput.value = chip.textContent.trim();
                handleSend();
            });
        });
    }
});

// --- MOCK PENCARIAN PAGE LOGIC REPLACED WITH LOCALSTORAGE ---
function renderSearchHistory(searchTerm = '') {
    const searchHistoryList = document.getElementById('searchHistoryListMock');
    if (!searchHistoryList) return;
    
    searchHistoryList.innerHTML = '';
    const convs = getConversations();
    
    const filtered = convs.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filtered.length === 0) {
        searchHistoryList.innerHTML = '<div style="text-align:center; padding:20px; color:#5E938B;">Tidak ada riwayat obrolan yang ditemukan</div>';
        return;
    }
    
    filtered.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'history-item-full';
        item.dataset.id = conv.id;
        item.style.cursor = 'pointer';
        
        item.innerHTML = `
            <span class="history-title">${conv.title}</span>
            <div class="history-actions">
                <span class="history-date">${formatDate(conv.date)}</span>
                <i class="ph ph-trash delete-chat-btn" data-id="${conv.id}"></i>
            </div>
        `;
        searchHistoryList.appendChild(item);
    });
}

const mainSearchInputMock = document.getElementById('mainSearchInput');
const modalSearchInput = document.getElementById('modalSearchInput');

if (document.getElementById('searchHistoryListMock')) {
    renderSearchHistory();
    const handleSearchInput = (e) => {
        renderSearchHistory(e.target.value.trim());
    };
    if (mainSearchInputMock) {
        mainSearchInputMock.addEventListener('input', handleSearchInput);
    }
    if (modalSearchInput) {
        modalSearchInput.addEventListener('input', handleSearchInput);
    }
}

// --- GLOBAL HISTORY CLICK LOGIC ---
document.addEventListener('click', (e) => {
    // Handle Delete
    const deleteBtn = e.target.closest('.delete-chat-btn');
    if (deleteBtn) {
        e.stopPropagation();
        const chatId = deleteBtn.dataset.id;
        let convs = getConversations();
        convs = convs.filter(c => c.id !== chatId);
        saveConversations(convs);
        
        // If the current chat is being deleted, redirect to new chat
        if (getActiveChatId() === chatId) {
            window.location.href = 'index.html';
            return;
        }
        
        renderSearchHistory(mainSearchInputMock ? mainSearchInputMock.value.trim() : '');
        renderSidebarHistory();
        return;
    }
    
    // Handle Navigate
    const historyItem = e.target.closest('.history-item, .history-item-full');
    if (historyItem) {
        const chatId = historyItem.dataset.id;
        if (chatId) {
            window.location.href = 'index.html?chatId=' + chatId;
        } else {
            window.location.href = 'index.html';
        }
    }
});

// Filter Pills & Mobile Load More Logic for Psikolog Page
function updateGlobalVisibility() {
    const isMobile = window.innerWidth <= 768;
    const isShowAll = document.body.classList.contains('show-all-cards');
    
    let matchedCardsCount = 0;
    const grids = document.querySelectorAll('.psikolog-grid');
    grids.forEach(grid => {
        const cards = Array.from(grid.querySelectorAll('.psikolog-card'));
        let visibleInGrid = 0;
        cards.forEach(card => {
            const shouldShow = card.dataset.shouldShow !== 'false';
            if (shouldShow) {
                matchedCardsCount++;
                if (isMobile && !isShowAll && matchedCardsCount > 3) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                    visibleInGrid++;
                }
            } else {
                card.style.display = 'none';
            }
        });
        
        const prevHeader = grid.previousElementSibling;
        if (visibleInGrid === 0) {
            grid.style.display = 'none';
            if (prevHeader && prevHeader.tagName === 'H2') prevHeader.style.display = 'none';
        } else {
            grid.style.display = '';
            if (prevHeader && prevHeader.tagName === 'H2') prevHeader.style.display = '';
        }
    });
    
    let globalBtn = document.getElementById('globalLoadMoreBtn');
    if (!globalBtn) {
        globalBtn = document.createElement('button');
        globalBtn.id = 'globalLoadMoreBtn';
        globalBtn.className = 'load-more-btn';
        globalBtn.textContent = 'Lihat Lebih Banyak';
        const section = document.querySelector('.psikolog-section');
        if (section) section.appendChild(globalBtn);
        
        globalBtn.addEventListener('click', () => {
            document.body.classList.add('show-all-cards');
            updateGlobalVisibility();
        });
    }
    
    if (isMobile && !isShowAll && matchedCardsCount > 3) {
        globalBtn.style.display = 'block';
    } else {
        globalBtn.style.display = 'none';
    }
    
    document.querySelectorAll('.load-more-btn:not(#globalLoadMoreBtn)').forEach(b => b.remove());
}

document.addEventListener('DOMContentLoaded', () => {
    const grids = document.querySelectorAll('.psikolog-grid');
    grids.forEach(grid => {
        grid.querySelectorAll('.psikolog-card').forEach(card => {
            card.dataset.shouldShow = 'true';
        });
    });
    if (grids.length > 0) {
        updateGlobalVisibility();
    }
    
    window.addEventListener('resize', () => {
        if (grids.length > 0) {
            updateGlobalVisibility();
        }
    });

    const filterPills = document.querySelectorAll('.filter-bar .pill:not(.primary)');
    if (filterPills.length > 0) {
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                
                const filterText = pill.textContent.trim().toLowerCase();
                
                grids.forEach(grid => {
                    const cards = grid.querySelectorAll('.psikolog-card');
                    cards.forEach(card => {
                        const title = card.querySelector('.card-title span')?.textContent.toLowerCase() || '';
                        const tags = Array.from(card.querySelectorAll('.tag')).map(t => t.textContent.toLowerCase());
                        const isOnline = card.querySelector('.availability.online');
                        
                        let shouldShow = false;
                        
                        if (filterText === 'tersedia sekarang') {
                            shouldShow = card.querySelector('.status-dot.green') !== null;
                        } else if (filterText === 'online' && isOnline) {
                            shouldShow = true;
                        } else if (filterText === 'psikolog' && title.includes('psikolog')) {
                            shouldShow = true;
                        } else if (filterText === 'konselor' && title.includes('konselor')) {
                            shouldShow = true;
                        } else if (filterText === 'psikiater' && tags.includes('psikiater')) {
                            shouldShow = true;
                        } else if (filterText === 'trauma' && tags.includes('trauma')) {
                            shouldShow = true;
                        } else {
                            if (title.includes(filterText) || tags.includes(filterText)) {
                                shouldShow = true;
                            }
                        }
                        card.dataset.shouldShow = shouldShow ? 'true' : 'false';
                    });
                });
                
                document.body.classList.remove('show-all-cards');
                updateGlobalVisibility();
            });
        });
    }
});


    // --- MOBILE SIDEBAR TOGGLE LOGIC ---
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileBackdrop = document.getElementById('mobileBackdrop');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.body.classList.add('sidebar-open');
        });
    }

    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', () => {
            document.body.classList.remove('sidebar-open');
        });
    }

    // --- SEARCH MODAL LOGIC ---
    const searchModal = document.getElementById('searchModal');
    const openSearchModalBtn = document.getElementById('openSearchModalBtn');
    const closeSearchModalBtn = document.getElementById('closeSearchModalBtn');
    const searchModalBackdrop = document.getElementById('searchModalBackdrop');
    const modalSearchInputEl = document.getElementById('modalSearchInput');

    function openSearchModal() {
        if(searchModal) {
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-open');
            }
            searchModal.classList.add('active');
            if(modalSearchInputEl) setTimeout(() => modalSearchInputEl.focus(), 100);
        }
    }

    function closeSearchModal() {
        if(searchModal) {
            searchModal.classList.remove('active');
        }
    }

    if(openSearchModalBtn) openSearchModalBtn.addEventListener('click', openSearchModal);
    if(closeSearchModalBtn) closeSearchModalBtn.addEventListener('click', closeSearchModal);
    if(searchModalBackdrop) searchModalBackdrop.addEventListener('click', closeSearchModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal && searchModal.classList.contains('active')) {
            closeSearchModal();
        }
    });
