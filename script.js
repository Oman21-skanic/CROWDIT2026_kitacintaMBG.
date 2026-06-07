document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');

    // === GEMINI API SETUP ===
    const GEMINI_API_KEY = 'AQ.Ab8RN6LHvIEOWri0UsNZ4LrMfA_4nST4er_ZL2Lopa7h0EIYcQ'; 
    
    // System instruction untuk persona Psikiater Pribadi
    const SYSTEM_PROMPT = `Anda adalah seorang psikiater pribadi dan konselor empati yang sangat ramah, suportif, dan menjadi pendengar yang baik. 
Tugas Anda adalah mendengarkan curhatan atau masalah pribadi pengguna, memberikan tanggapan yang menenangkan, tidak menghakimi, dan memvalidasi perasaan mereka. 
Gunakan bahasa Indonesia yang hangat, santai tapi sopan. Hindari menggunakan bahasa kaku.
Berikan saran psikologis ringan jika dirasa perlu, namun fokus utama adalah membuat pengguna merasa didengarkan dan dimengerti. 
Ingat, jika pengguna baru menyapa, sapa balik dengan sangat ramah dan tanyakan apa yang sedang mereka rasakan.`;

    let conversationHistory = [];

    function formatTextToHTML(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    function addMessage(text, isSent = true, saveToHistory = false) {
        if (!text || !chatMessages) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const messageWrapper = document.createElement('div');
        messageWrapper.className = "message-wrapper " + (isSent ? 'sent' : 'received');

        messageWrapper.innerHTML = `
            <div class="message">
                <div class="bubble">
                    <p>${formatTextToHTML(text)}</p>
                    <span class="time">${timeString}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (saveToHistory) {
            conversationHistory.push({
                role: isSent ? "user" : "model",
                parts: [{ text: text }]
            });
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

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const aiResponseText = data.candidates[0].content.parts[0].text;
            
            hideTypingIndicator();
            addMessage(aiResponseText, false, true); 
        } catch (error) {
            console.error("Gemini API Error:", error);
            hideTypingIndicator();
            addMessage("Maaf ya, koneksi terganggu. Boleh coba lagi?", false, false);
        }
    }

    async function handleSend() {
        if(!messageInput) return;
        const text = messageInput.value.trim();
        if (!text) return;

        addMessage(text, true, true);
        messageInput.value = '';

        showTypingIndicator();
        setBotStatus('meresapi ceritamu...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setBotStatus('mencari tanggapan terbaik...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setBotStatus('sedang mengetik...');
        generateResponse(text);
    }

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

// --- MOCK PENCARIAN PAGE LOGIC ---
const searchHistoryListMock = document.getElementById('searchHistoryListMock');
const mainSearchInputMock = document.getElementById('mainSearchInput');
if (searchHistoryListMock && mainSearchInputMock) {
    const historyItems = searchHistoryListMock.querySelectorAll('.history-item-full');
    mainSearchInputMock.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        historyItems.forEach(item => {
            const title = item.querySelector('.history-title').textContent.toLowerCase();
            if (title.includes(term)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
}

// --- GLOBAL HISTORY CLICK LOGIC ---
document.addEventListener('click', (e) => {
    const historyItem = e.target.closest('.history-item, .history-item-full');
    if (historyItem) {
        if (e.target.closest('.ph-trash')) {
            return;
        }
        window.location.href = 'index.html';
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

    // (Removed duplicate collapseBtn logic)
