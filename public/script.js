document.addEventListener('DOMContentLoaded', () => {
    const noBtn = document.getElementById('no-btn');
    const yesBtn = document.getElementById('yes-btn');
    const overlay = document.getElementById('valentine-overlay');
    const mainContent = document.getElementById('main-content');
    const todoList = document.getElementById('todo-list');
    const newTodoInput = document.getElementById('new-todo');
    const addBtn = document.getElementById('add-btn');

    // Check if already entered
    if (localStorage.getItem('valentine_entered') === 'true') {
        overlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        startCountdowns();
        loadTodos();
    }

    // 1. "No" Button Interaction
    noBtn.addEventListener('mouseover', moveButton);
    noBtn.addEventListener('click', moveButton);
    noBtn.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent click simulation
        moveButton();
    });

    function moveButton() {
        const padding = 20; // Buffer from edge

        // Use the smaller dimension to prevent overflow on mobile browsers with bars
        const vw = Math.min(window.innerWidth, document.documentElement.clientWidth);
        const vh = Math.min(window.innerHeight, document.documentElement.clientHeight);

        // Ensure accurate button dimensions
        // Fallback to minimal dimensions just in case offsetWidth is 0 (hidden)
        const btnW = noBtn.offsetWidth || 100;
        const btnH = noBtn.offsetHeight || 40;

        // Calculate safe boundaries
        const maxLeft = vw - btnW - padding;
        const maxTop = vh - btnH - padding;

        // Generate random position within safe bounds
        // Math.max(padding, ...) ensures we don't return negative values if screen is too small
        const x = Math.max(padding, Math.random() * maxLeft);
        const y = Math.max(padding, Math.random() * maxTop);

        noBtn.style.position = 'fixed';
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
        noBtn.style.zIndex = '9999'; // Ensure it stays on top of everything
    }

    // 2. "Yes" Button Interaction
    yesBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        mainContent.classList.remove('hidden');
        localStorage.setItem('valentine_entered', 'true');
        startCountdowns();
        loadTodos(); // Load todos only when entering main site
    });

    // 3. Countdowns
    const dates = {
        'valentine': new Date('2026-02-14T00:00:00'),
        '1-5-years': new Date('2026-02-26T00:00:00'),
        '2-years': new Date('2026-08-26T00:00:00')
    };

    function startCountdowns() {
        setInterval(() => {
            const now = new Date();
            for (const [id, targetDate] of Object.entries(dates)) {
                const diff = targetDate - now;
                const element = document.getElementById(`timer-${id}`);

                if (diff <= 0) {
                    element.innerHTML = "הגיע הזמן! ❤️";
                } else {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    element.innerHTML = `${days} ימים`;
                }
            }
        }, 1000);
    }

    // 4. Todo List Logic
    let todos = [];

    async function loadTodos() {
        const res = await fetch('/api/todos');
        todos = await res.json();
        renderTodos();
    }

    async function saveTodos() {
        await fetch('/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todos)
        });
    }

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

            // Checkbox container
            const checkbox = document.createElement('div');
            checkbox.className = 'todo-checkbox';
            checkbox.addEventListener('click', () => toggleTodo(index));

            // Text content
            const span = document.createElement('span');
            span.className = 'todo-text';
            span.textContent = todo.text;
            span.addEventListener('click', () => toggleTodo(index));

            // Delete button
            const btn = document.createElement('button');
            btn.innerHTML = '🗑️';
            btn.className = 'delete-btn';
            btn.title = 'מחיקה';
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggle
                deleteTodo(index);
            });

            li.appendChild(checkbox);
            li.appendChild(span);
            li.appendChild(btn);
            todoList.appendChild(li);
        });
    }

    function addTodo() {
        const text = newTodoInput.value.trim();
        if (text) {
            todos.push({ text, completed: false });
            newTodoInput.value = '';
            renderTodos();
            saveTodos();
        }
    }

    function toggleTodo(index) {
        todos[index].completed = !todos[index].completed;
        renderTodos();
        saveTodos();
    }

    function deleteTodo(index) {
        todos.splice(index, 1);
        renderTodos();
        saveTodos();
    }

    addBtn.addEventListener('click', addTodo);
    newTodoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // 5. Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden');
            });

            // Add active class to clicked button
            btn.classList.add('active');

            // Show corresponding content
            const tabId = btn.getAttribute('data-tab');
            const content = document.getElementById(`tab-${tabId}`);
            content.classList.add('active');
            content.classList.remove('hidden');
        });
    });



    // 6. Chat Logic
    const chatLoginDiv = document.getElementById('chat-login');
    const chatInterfaceDiv = document.getElementById('chat-interface');
    const chatNameInput = document.getElementById('chat-name-input');
    const chatLoginBtn = document.getElementById('chat-login-btn');
    const loginError = document.getElementById('login-error');
    const chatUserDisplay = document.getElementById('chat-user-display');
    const chatLogoutBtn = document.getElementById('chat-logout-btn');
    const chatMessagesDiv = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    const VALID_NAMES = ['רימון', 'נתנאל'];
    let chatUser = localStorage.getItem('chat_user');
    let chatInterval = null;

    function initChat() {
        if (chatUser && VALID_NAMES.includes(chatUser)) {
            showChatInterface();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        chatLoginDiv.classList.remove('hidden');
        chatInterfaceDiv.classList.add('hidden');
        if (chatInterval) clearInterval(chatInterval);
        localStorage.removeItem('chat_user');
        chatUser = null;
    }

    function showChatInterface() {
        chatLoginDiv.classList.add('hidden');
        chatInterfaceDiv.classList.remove('hidden');
        chatUserDisplay.textContent = `שלום ${chatUser} ❤️`;
        loadMessages();
        chatInterval = setInterval(loadMessages, 3000); // Poll every 3 seconds
    }

    chatLoginBtn.addEventListener('click', () => {
        const name = chatNameInput.value.trim();
        if (VALID_NAMES.includes(name)) {
            chatUser = name;
            localStorage.setItem('chat_user', chatUser);
            loginError.classList.add('hidden');
            showChatInterface();
        } else {
            loginError.classList.remove('hidden');
        }
    });

    chatLogoutBtn.addEventListener('click', () => {
        showLogin();
    });

    async function loadMessages() {
        try {
            const res = await fetch('/api/chat');
            const messages = await res.json();
            renderMessages(messages);
        } catch (e) {
            console.error(e);
        }
    }

    function renderMessages(messages) {
        chatMessagesDiv.innerHTML = '';

        messages.forEach(msg => {
            const isMine = msg.user === chatUser;
            const bubble = document.createElement('div');
            bubble.className = `message-bubble ${isMine ? 'message-mine' : 'message-other'}`;

            const time = new Date(msg.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

            bubble.innerHTML = `
                ${msg.text}
                <span class="message-time">${time}</span>
            `;

            chatMessagesDiv.appendChild(bubble);
        });

        // Scroll to bottom
        chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !chatUser) return;

        chatInput.value = ''; // Clear locally immediately

        await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: chatUser, text })
        });

        loadMessages();
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Initialize logic checking
    if (localStorage.getItem('chat_user')) {
        chatUser = localStorage.getItem('chat_user');
        initChat();
    }

});
