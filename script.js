// --- LOCAL STORAGE HELPERS ---
function getConversations() {
  const data = localStorage.getItem('tenangin_conversations');
  return data ? JSON.parse(data) : [];
}

function saveConversations(convs) {
  let saved = false;
  while (!saved && convs.length > 0) {
    try {
      localStorage.setItem("tenangin_conversations", JSON.stringify(convs));
      saved = true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn("Storage penuh. Menghapus riwayat lama...");
        convs.pop();
      } else {
        console.error("Gagal menyimpan percakapan:", e);
        break;
      }
    }
  }
}

function getActiveChatId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('chatId');
}

function renderSidebarHistory() {
  const historyLists = document.querySelectorAll('.history-list');
  if (historyLists.length === 0) return;

  const convs = getConversations();
  historyLists.forEach((list) => {
    list.innerHTML = '';
    if (convs.length === 0) {
      list.innerHTML =
        '<div class="history-item" style="opacity: 0.5;">Belum ada riwayat</div>';
      return;
    }
    convs.forEach((conv) => {
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
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // --- AUTHENTICATION CHECK ---
  const currentPath = window.location.pathname;
  if (
    !currentPath.includes('login.html') &&
    !currentPath.includes('register.html') &&
    !currentPath.includes('forgot-password.html')
  ) {
    const activeUserStr = localStorage.getItem('tenangin_active_user');
    if (activeUserStr) {
      try {
        const activeUser = JSON.parse(activeUserStr);
        const nameEls = document.querySelectorAll('.user-profile-info h3');
        const emailEls = document.querySelectorAll('.user-profile-info span');
        const iconEls = document.querySelectorAll('.user-profile-login-icon');

        nameEls.forEach((el) => (el.textContent = activeUser.name));
        emailEls.forEach((el) => (el.textContent = activeUser.email));
        iconEls.forEach((el) => {
          const img = document.createElement('img');
          img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activeUser.name)}&background=E5E5E5&color=000&size=40`;
          img.alt = activeUser.name;
          el.parentNode.insertBefore(img, el);
          el.remove();
        });

        const profileBtns = document.querySelectorAll(
          '.user-profile-footer, .mobile-header-profile, .header-action',
        );
        profileBtns.forEach((btn) => {
          btn.style.cursor = 'pointer';
          btn.addEventListener('click', () => {
            window.location.href = 'features/profile/profile.html';
          });
        });
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    } else {
      const profileBtns = document.querySelectorAll(
        '.user-profile-footer, .mobile-header-profile, .header-action',
      );
      profileBtns.forEach((btn) => {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
          window.location.href = 'features/auth/login.html';
        });
      });
    }
  }

  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatMessages = document.getElementById("chatMessages");
  const suggestionChipsContainer = document.querySelector(".suggestion-chips");

  const fileUploadInput = document.getElementById('fileUploadInput');
  const addBtn = document.getElementById('addBtn');
  const imagePreviewContainer = document.getElementById(
    'imagePreviewContainer',
  );
  const imagePreview = document.getElementById('imagePreview');
  const imageName = document.getElementById('imageName');
  const removeImageBtn = document.getElementById('removeImageBtn');

  let currentImageBase64 = null;
  let currentImageMime = null;
  let currentImageFile = null;

  // === GEMINI API SETUP ===
  const GEMINI_API_KEY =
    "AQ.Ab8RN6LHvIEOWri0UsNZ4LrMfA_4nST4er_ZL2Lopa7h0EIYcQ";

  let isGeneratingResponse = false;
  let currentAbortController = null;

  function resetSendButton() {
    if (messageInput) {
      messageInput.disabled = false;
      messageInput.focus();
    }
    if (sendBtn) {
      sendBtn.innerHTML = '<i class="ph-fill ph-paper-plane-right"></i>';
      sendBtn.style.color = '';
    }
    isGeneratingResponse = false;
    currentAbortController = null;
  }

  // System instruction untuk persona Psikiater Pribadi
  const SYSTEM_PROMPT = `
    Kamu adalah Tanin, seorang konselor kesehatan mental berbasis AI yang hangat, profesional, dan terpercaya. Kamu hadir sebagai teman bicara sekaligus pendamping psikologis yang terlatih (bukan pengganti terapis profesional, namun mampu memberikan dukungan emosional yang bermakna, validasi perasaan, dan panduan psikologis berbasis evidens).
Kamu berbicara dalam Bahasa Indonesia yang mudah dimengerti, alami, hangat, dan tidak kaku (seperti berbicara dengan seseorang yang peduli dan paham).

Respon rule 
jangan pernah pakai ' - ' atau ' — ' long striped line buat menyambungkan kata, karena itu ai banget. Buat semanusia mungkin, tidak long text, dan tidak yapping.

PRINSIP UTAMA PERCAKAPAN
1. DENGARKAN DULU, SARANKAN KEMUDIAN
Selalu prioritaskan mendengarkan dan memvalidasi perasaan pengguna sebelum memberikan saran apapun. Jangan terburu-buru memberikan solusi.
2. VALIDASI TANPA MENGHAKIMI
Terima semua perasaan pengguna apa adanya. Hindari kalimat yang meremehkan atau menghakimi seperti "seharusnya kamu...", "itu tidak terlalu serius", atau "banyak orang yang lebih susah".
3. GUNAKAN NAMA PENGGUNA
Jika pengguna memperkenalkan namanya, gunakan namanya sesekali dalam percakapan agar terasa lebih personal.
4. INGAT KONTEKS SESI
Ingat dan rujuk kembali hal-hal yang sudah disampaikan pengguna dalam satu sesi percakapan yang sama. Ini menunjukkan kamu benar-benar mendengarkan, bukan sekadar merespons.
5. RESPONS SANGAT SINGKAT & HEMAT TOKEN
Buat respons yang sangat ringkas dan padat. Jawab maksimal 1-2 paragraf pendek saja (maksimal 3-4 kalimat). Hindari membuang-buang kata agar lebih hemat token, namun tetap pertahankan nada hangat dan empati.
6. AKHIRI DENGAN PERTANYAAN TERBUKA
Hampir selalu akhiri respons dengan satu pertanyaan yang membuka ruang untuk pengguna bercerita lebih, kecuali jika kondisi mengharuskan intervensi krisis.
---
CARA MEMULAI PERCAKAPAN
Saat pengguna pertama kali menyapa, sambut mereka dengan hangat dan tanyakan apa yang sedang mereka rasakan atau ingin ceritakan hari ini. Contoh:
"Hei, senang kamu mampir ke sini. Aku Tanin, aku di sini untuk mendengarkan dan menemanimu. Mau cerita apa yang lagi kamu rasakan hari ini?"
Jika pengguna langsung menceritakan masalah tanpa menyapa, langsung ikuti alirannya, tidak perlu memaksa sapaan formal.

TEKNIK PSIKOLOGIS (JIKA DIMINTA)
Tawarkan atau jelaskan teknik psikologis HANYA jika pengguna memintanya secara langsung atau tersirat membutuhkan alat bantu konkret. Jangan memaksakan teknik di tengah-tengah sesi curhat emosional.

Teknik yang boleh ditawarkan:
- Latihan pernapasan (box breathing, 4-7-8 breathing)
- Grounding technique (5-4-3-2-1 senses)
- Journaling prompt
- Cognitive reframing sederhana
- Mindfulness singkat

Cara menawarkan: "Kalau kamu mau, aku bisa ajarin satu teknik pernapasan singkat yang kadang membantu di situasi kayak gini, mau dicoba?"

PROTOKOL KRISIS & DARURAT

Jika pengguna menunjukkan tanda-tanda krisis serius (seperti menyebutkan keinginan menyakiti diri sendiri, bunuh diri, atau situasi berbahaya), SEGERA lakukan hal berikut:

LANGKAH 1: Akui perasaan mereka dengan empati singkat.
LANGKAH 2: Sampaikan dengan jelas bahwa kamu peduli dengan keselamatan mereka.
LANGKAH 3: Berikan informasi hotline krisis:

"Aku sangat khawatir dengan keselamatanmu sekarang. Tolong hubungi Into The Light Indonesia di 119 ext 8. Mereka siap mendengarkan 24 jam, dan kamu tidak harus melewati ini sendirian."

LANGKAH 4: Tetap hadir dan tidak meninggalkan percakapan secara tiba-tiba.

Hotline darurat:
- Into The Light Indonesia: 119 ext 8
- Yayasan Pulih: (021) 788-42580
- RSJ Grhasia: (0274) 895231

BATASAN PERAN

- Jangan pernah berpura-pura menjadi terapis berlisensi atau psikiater sungguhan.
- Jangan memberikan diagnosis medis atau psikiatri apapun.
- Jangan meresepkan atau menyarankan obat-obatan spesifik.
- Jika pengguna membutuhkan bantuan profesional, arahkan dengan lembut:
"Aku senang bisa menemanimu sampai sejauh ini. Berdasarkan apa yang kamu ceritakan, aku rasa kamu akan sangat terbantu jika ngobrol langsung dengan psikolog atau konselor. Mau aku bantu cari informasinya?"
  `;

  let conversationHistory = [];
  let currentConversationId = getActiveChatId();
  let currentTitle = 'Obrolan Baru';

  // Load active conversation if exists
  if (currentConversationId) {
    const convs = getConversations();
    const activeConv = convs.find((c) => c.id === currentConversationId);
    if (activeConv) {
      if (suggestionChipsContainer && activeConv.messages.some(m => m.role === "user")) {
        suggestionChipsContainer.style.display = "none";
      }
      currentTitle = activeConv.title;
      activeConv.messages.forEach((msg) => {
        addMessage(
          msg.text,
          msg.role === 'user',
          false,
          false,
          msg.time,
          msg.imageBase64,
          msg.imageMime,
        );
        let parts = [{ text: msg.text }];
        if (msg.imageBase64 && msg.imageMime) {
          parts.unshift({
            inlineData: { mimeType: msg.imageMime, data: msg.imageBase64 },
          });
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

  function addMessage(
    text,
    isSent = true,
    saveToHistory = false,
    animateTyping = false,
    customTime = null,
    imageBase64 = null,
    imageMime = null,
  ) {
    if (!text && !imageBase64) return;
    if (!chatMessages) return;

    const now = new Date();
    const timeString =
      customTime ||
      now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    const messageWrapper = document.createElement('div');
    messageWrapper.className =
      'message-wrapper ' + (isSent ? 'sent' : 'received') + ' animate-in';

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

    if (text && animateTyping && !isSent) {
      const formatted = formatTextToHTML(text);
      const parts = formatted.split(/(<[^>]+>|\s+)/);
      let wordIdx = 0;
      const step = 20;

      for (const part of parts) {
        if (part === '') continue;
        const span = document.createElement('span');
        span.innerHTML = part;
        span.style.display = 'inline';

        const isWhitespace = /^\s+$/.test(part);
        const isTag = /^<[^>]+>$/.test(part);

        if (!isWhitespace && !isTag) {
          span.classList.add('word-fade');
          span.style.animationDelay = `${wordIdx * step}ms`;
          wordIdx++;
        }

        p.appendChild(span);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } else if (text) {
      p.innerHTML = formatTextToHTML(text);
    }

    if (saveToHistory) {
      let parts = [{ text: text }];
      if (imageBase64 && imageMime) {
        parts.unshift({
          inlineData: { mimeType: imageMime, data: imageBase64 },
        });
      }
      conversationHistory.push({
        role: isSent ? 'user' : 'model',
        parts: parts,
      });

      // Save to LocalStorage
      let convs = getConversations();
      if (!currentConversationId) {
        currentConversationId = 'conv_' + Date.now();
        currentTitle = isSent
          ? text.length > 30
            ? text.substring(0, 30) + '...'
            : text
          : 'Obrolan Baru';
        const newConv = {
          id: currentConversationId,
          title: currentTitle,
          date: now.toISOString(),
          messages: [],
        };
        convs.unshift(newConv);

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('chatId', currentConversationId);
        window.history.replaceState({}, '', url);
      } else if (isSent && currentTitle === 'Obrolan Baru' && text) {
        currentTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
        const activeConv = convs.find((c) => c.id === currentConversationId);
        if (activeConv) {
          activeConv.title = currentTitle;
        }
      }

      const activeConv = convs.find((c) => c.id === currentConversationId);
      if (activeConv) {
        activeConv.messages.push({
          role: isSent ? 'user' : 'model',
          text: text,
          time: timeString,
          timestamp: now.getTime(),
          imageBase64: imageBase64,
          imageMime: imageMime,
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
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
      injectMeshBlobs(chatHeader);
      void chatHeader.offsetHeight;
      chatHeader.classList.add('thinking');
    }
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

  function injectMeshBlobs(container) {
    if (container.querySelector('.mesh-glow')) return;
    const glow = document.createElement('div');
    glow.className = 'mesh-glow';
    container.appendChild(glow);
    for (let i = 1; i <= 6; i++) {
      const blob = document.createElement('div');
      blob.className = 'mesh-blob mesh-blob--' + i;
      container.appendChild(blob);
    }
  }

  function removeMeshBlobs(container) {
    container
      .querySelectorAll('.mesh-blob, .mesh-glow')
      .forEach((el) => el.remove());
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
      indicator.remove();
    }
    const chatHeader = document.querySelector('.chat-header');
    if (chatHeader) {
      chatHeader.classList.remove('thinking');
      setTimeout(function () {
        removeMeshBlobs(chatHeader);
      }, 1100);
    }
    setBotStatus('siap mendengarkan');
  }

  async function generateResponse(userMessage) {
    if (!GEMINI_API_KEY) {
      hideTypingIndicator();
      addMessage('Halo! API Key belum diset.', false, false);
      return;
    }

    try {
      const payload = {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: conversationHistory,
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: currentAbortController ? currentAbortController.signal : undefined
        },
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const aiResponseText = data.candidates[0].content.parts[0].text;

      hideTypingIndicator();
      addMessage(aiResponseText, false, true, true);
      resetSendButton();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request dibatalkan oleh user');
        return;
      }
      console.error('Gemini API Error:', error);
      hideTypingIndicator();
      addMessage(
        'Maaf ya, koneksi terganggu. Boleh coba lagi?',
        false,
        false,
        true,
      );
      resetSendButton();
    }
  }

  if (addBtn && fileUploadInput) {
    addBtn.addEventListener('click', () => fileUploadInput.click());
    fileUploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Hanya format gambar yang didukung untuk saat ini.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const base64Data = dataUrl.split(",")[1];
          const approxSize = Math.round((base64Data.length * 3) / 4);

          currentImageBase64 = base64Data;
          currentImageMime = "image/jpeg";
          currentImageFile = {
            name: file.name,
            size: approxSize,
            type: "image/jpeg",
            data: dataUrl,
          };

          if (imagePreviewContainer && imagePreview && imageName) {
            imagePreview.src = dataUrl;
            imageName.textContent = file.name;
            imagePreviewContainer.style.display = "flex";
          }
        };
        img.src = event.target.result;
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
    if (isGeneratingResponse) {
      if (currentAbortController) {
        currentAbortController.abort();
      }
      hideTypingIndicator();
      resetSendButton();
      return;
    }

    const activeUserStr = localStorage.getItem('tenangin_active_user');
    if (!activeUserStr) {
      const authModal = document.getElementById('authModal');
      if (authModal) authModal.classList.add('active');
      return;
    }

    if (!messageInput) return;
    const text = messageInput.value.trim();
    if (!text && !currentImageBase64) return;

    const sentBase64 = currentImageBase64;
    const sentMime = currentImageMime;

    if (currentImageFile) {
      const koleksiData = localStorage.getItem('tenangin_koleksi');
      const koleksi = koleksiData ? JSON.parse(koleksiData) : [];
      const now = new Date();
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const dateStr = `${now.getDate()} ${months[now.getMonth()]}`;

      koleksi.unshift({
        id: 'koleksi_' + Date.now(),
        name: currentImageFile.name,
        type: 'Gambar',
        size: (currentImageFile.size / 1024).toFixed(2) + ' KB',
        date: dateStr,
        data: currentImageFile.data,
      });
      let saved = false;
      while (!saved && koleksi.length > 0) {
        try {
          localStorage.setItem("tenangin_koleksi", JSON.stringify(koleksi));
          saved = true;
        } catch (e) {
          if (e.name === 'QuotaExceededError' || e.code === 22) {
            koleksi.pop();
          } else {
            console.error("Gagal menyimpan ke localStorage:", e);
            break;
          }
        }
      }
    }

    addMessage(text, true, true, false, null, sentBase64, sentMime);
    messageInput.value = '';
    messageInput.disabled = true;

    if (sendBtn) {
      sendBtn.innerHTML = '<i class="ph-fill ph-stop-circle"></i>';
      sendBtn.style.color = '#e74c3c';
    }

    isGeneratingResponse = true;
    currentAbortController = new AbortController();

    if (suggestionChipsContainer) {
      suggestionChipsContainer.style.display = "none";
    }

    if (removeImageBtn) removeImageBtn.click();

    showTypingIndicator();
    setBotStatus('meresapi ceritamu...');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    if (!isGeneratingResponse) return;

    setBotStatus('mencari tanggapan terbaik...');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (!isGeneratingResponse) return;

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
    if (
      e.key === 'Escape' &&
      authModal &&
      authModal.classList.contains('active')
    ) {
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
      const hasMessages =
        chatMessages.querySelectorAll('.message-wrapper').length > 0;
      if (!hasMessages) {
        const greetings = [
          'Hei, senang kamu mampir ke sini. Aku Tanin, aku di sini untuk mendengarkan dan menemanimu. Mau cerita apa yang lagi kamu rasakan hari ini?',
          'Hai! Aku Tanin. Senang bisa terhubung denganmu. Bagaimana harimu berjalan sejauh ini?',
          'Halo! Aku Tanin, teman diskusimu di sini. Kalau ada yang sedang membebani pikiranmu, aku siap mendengarkan. Ada yang ingin kamu bagi hari ini?',
          'Hai! Aku Tanin. Kadang meluapkan apa yang terpendam bisa bikin perasaan jauh lebih tenang. Mau mulai cerita dari mana?',
          'Halo, senang kamu ada di sini. Aku Tanin. Aku siap menemanimu dan mendengarkan keluh kesahmu dengan hangat. Apa yang sedang memenuhi kepalamu saat ini?',
        ];
        const randomGreeting =
          greetings[Math.floor(Math.random() * greetings.length)];

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
      if (window.innerWidth <= 1024) {
        // Close the drawer (tablet/mobile)
        document.body.classList.remove('sidebar-open');
      } else {
        // Desktop: Toggle mini-sidebar mode
        document.body.classList.toggle('sidebar-collapsed');
      }
    });
  }

  // Logo click toggles sidebar like collapse button
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        document.body.classList.remove('sidebar-open');
      } else {
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
      historyCaret.style.transform = historyList.classList.contains('collapsed')
        ? 'rotate(0deg)'
        : 'rotate(90deg)';
      historyCaret.style.transition = 'transform 0.3s ease';
    });
  }

  // Animated Placeholder Logic
  const placeholderTemplates = [
    'Tulis perasaanmu di sini...',
    'Ceritakan apa yang membuatmu gelisah...',
    'Ada hal yang membebani pikiranmu?',
    'Aku siap mendengarkan ceritamu...',
  ];

  let placeholderIdx = 0;
  let charIdx = 0;
  let isDeletingPlaceholder = false;
  let typingDelay = 100;

  function typePlaceholder() {
    if (!messageInput) return;

    if (
      document.activeElement === messageInput ||
      messageInput.value.length > 0
    ) {
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
    'Aku merasa cemas',
    'Aku sedang stres',
    'Aku hanya ingin ngobrol',
    'Aku ingin bercerita',
    'Pikiranku sedang kacau',
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

  const filtered = convs.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (filtered.length === 0) {
    searchHistoryList.innerHTML =
      '<div style="text-align:center; padding:20px; color:#5E938B;">Tidak ada riwayat obrolan yang ditemukan</div>';
    return;
  }

  filtered.forEach((conv) => {
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
    convs = convs.filter((c) => c.id !== chatId);
    saveConversations(convs);

    // If the current chat is being deleted, redirect to new chat
    if (getActiveChatId() === chatId) {
      window.location.href = 'index.html';
      return;
    }

    renderSearchHistory(
      mainSearchInputMock ? mainSearchInputMock.value.trim() : '',
    );
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
  grids.forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll('.psikolog-card'));
    let visibleInGrid = 0;
    cards.forEach((card) => {
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
      if (prevHeader && prevHeader.tagName === 'H2')
        prevHeader.style.display = 'none';
    } else {
      grid.style.display = '';
      if (prevHeader && prevHeader.tagName === 'H2')
        prevHeader.style.display = '';
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

  document
    .querySelectorAll('.load-more-btn:not(#globalLoadMoreBtn)')
    .forEach((b) => b.remove());
}

document.addEventListener('DOMContentLoaded', () => {
  const grids = document.querySelectorAll('.psikolog-grid');
  grids.forEach((grid) => {
    grid.querySelectorAll('.psikolog-card').forEach((card) => {
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

  const filterPills = document.querySelectorAll(
    '.filter-bar .pill:not(.primary)',
  );
  if (filterPills.length > 0) {
    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const filterText = pill.textContent.trim().toLowerCase();

        grids.forEach((grid) => {
          const cards = grid.querySelectorAll('.psikolog-card');
          cards.forEach((card) => {
            const title =
              card
                .querySelector('.card-title span')
                ?.textContent.toLowerCase() || '';
            const tags = Array.from(card.querySelectorAll('.tag')).map((t) =>
              t.textContent.toLowerCase(),
            );
            const isOnline = card.querySelector('.availability.online');

            let shouldShow = false;

            if (filterText === 'tersedia sekarang') {
              shouldShow = card.querySelector('.status-dot.green') !== null;
            } else if (filterText === 'online' && isOnline) {
              shouldShow = true;
            } else if (
              filterText === 'psikolog' &&
              title.includes('psikolog')
            ) {
              shouldShow = true;
            } else if (
              filterText === 'konselor' &&
              title.includes('konselor')
            ) {
              shouldShow = true;
            } else if (
              filterText === 'psikiater' &&
              tags.includes('psikiater')
            ) {
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
  if (searchModal) {
    if (window.innerWidth <= 1024) {
      document.body.classList.remove('sidebar-open');
    }
    searchModal.classList.add('active');
    if (modalSearchInputEl) setTimeout(() => modalSearchInputEl.focus(), 100);
  }
}

function closeSearchModal() {
  if (searchModal) {
    searchModal.classList.remove('active');
  }
}

if (openSearchModalBtn)
  openSearchModalBtn.addEventListener('click', openSearchModal);
if (closeSearchModalBtn)
  closeSearchModalBtn.addEventListener('click', closeSearchModal);
if (searchModalBackdrop)
  searchModalBackdrop.addEventListener('click', closeSearchModal);

document.addEventListener('keydown', (e) => {
  if (
    e.key === 'Escape' &&
    searchModal &&
    searchModal.classList.contains('active')
  ) {
    closeSearchModal();
  }
});
