document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');

    function addMessage(text, isSent = true) {
        if (!text.trim()) return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${isSent ? 'sent' : 'received'}`;

        messageWrapper.innerHTML = `
            <div class="message">
                <div class="bubble">
                    <p>${text}</p>
                    <span class="time">${timeString}</span>
                </div>
            </div>
        `;

        chatMessages.appendChild(messageWrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    sendBtn.addEventListener('click', () => {
        addMessage(messageInput.value);
        messageInput.value = '';
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addMessage(messageInput.value);
            messageInput.value = '';
        }
    });

    // Sidebar collapse functionality
    const collapseBtn = document.getElementById('collapseBtn');
    const sidebar = document.getElementById('sidebar');

    if (collapseBtn && sidebar) {
        collapseBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
        });
    }

    // History Dropdown Toggle
    const historyDropdown = document.getElementById('historyDropdown');
    const historyList = document.getElementById('historyList');
    const historyCaret = document.getElementById('historyCaret');

    if (historyDropdown && historyList && historyCaret) {
        historyDropdown.addEventListener('click', () => {
            historyList.classList.toggle('collapsed');
            historyCaret.style.transform = historyList.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0deg)';
            historyCaret.style.transition = 'transform 0.3s ease';
        });
    }
});