// ===== App State =====
const APP_KEY = 'personalDashboard';

const defaultState = {
    events: [],
    notes: [],
    expenses: [],
    shoppingItems: [],
    groceryItems: [],
    monthlyIncome: 0,
    theme: 'light'
};

let state = loadState();
let currentCalendarDate = new Date();
let selectedDate = new Date();
let selectedNoteColor = '#fef3c7';

// ===== State Management =====
function loadState() {
    try {
        const saved = localStorage.getItem(APP_KEY);
        return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
    } catch {
        return { ...defaultState };
    }
}

function saveState() {
    localStorage.setItem(APP_KEY, JSON.stringify(state));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initCalendar();
    initNotes();
    initBudget();
    initShopping();
    updateGreeting();
    updateDashboard();
    setInterval(updateGreeting, 60000);
});

// ===== Theme =====
function initTheme() {
    if (state.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').querySelector('span:last-child').textContent = 'Light Mode';
        document.getElementById('darkModeToggle').querySelector('.nav-icon').textContent = '☀️';
    }

    document.getElementById('darkModeToggle').addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? '' : 'dark');
        state.theme = isDark ? 'light' : 'dark';
        saveState();

        const btn = document.getElementById('darkModeToggle');
        btn.querySelector('span:last-child').textContent = isDark ? 'Dark Mode' : 'Light Mode';
        btn.querySelector('.nav-icon').textContent = isDark ? '🌙' : '☀️';
    });
}

// ===== Greeting =====
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Good Evening!';
    if (hour < 12) greeting = 'Good Morning!';
    else if (hour < 17) greeting = 'Good Afternoon!';

    document.getElementById('greetingText').textContent = greeting;
    document.getElementById('dateDisplay').textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ===== Navigation =====
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            switchSection(section);
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Close mobile menu
            document.querySelector('.sidebar').classList.remove('open');
        });
    });

    document.getElementById('menuToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Close sidebar on outside click (mobile)
    document.querySelector('.main-content').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.remove('open');
    });
}

function switchSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'dashboard') updateDashboard();
}

function quickAction(section) {
    switchSection(section);
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.section === section);
    });

    setTimeout(() => {
        switch (section) {
            case 'calendar': document.getElementById('addEventBtn').click(); break;
            case 'notes': document.getElementById('addNoteBtn').click(); break;
            case 'budget': document.getElementById('addExpenseBtn').click(); break;
            case 'shopping': document.getElementById('shoppingItemInput').focus(); break;
        }
    }, 100);
}

// ===== Modal Helpers =====
function openModal(id) {
    document.getElementById(id).classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== CALENDAR =====
function initCalendar() {
    renderCalendar();

    document.getElementById('prevMonth').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    document.getElementById('todayBtn').addEventListener('click', () => {
        currentCalendarDate = new Date();
        selectedDate = new Date();
        renderCalendar();
        renderEvents();
    });

    document.getElementById('addEventBtn').addEventListener('click', () => {
        document.getElementById('eventId').value = '';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventDate').value = formatDateInput(selectedDate);
        document.getElementById('eventTime').value = '';
        document.getElementById('eventCategory').value = 'personal';
        document.getElementById('eventDescription').value = '';
        document.getElementById('eventModalTitle').textContent = 'Add Event';
        openModal('eventModal');
    });

    document.getElementById('saveEventBtn').addEventListener('click', saveEvent);
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    document.getElementById('calendarMonthYear').textContent =
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const today = new Date();
    grid.innerHTML = '';

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const date = new Date(year, month - 1, day);
        grid.appendChild(createDayElement(day, date, true));
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        grid.appendChild(createDayElement(day, date, false, isToday, isSelected));
    }

    // Next month days
    const totalCells = grid.children.length;
    const remaining = 42 - totalCells;
    for (let day = 1; day <= remaining; day++) {
        const date = new Date(year, month + 1, day);
        grid.appendChild(createDayElement(day, date, true));
    }

    renderEvents();
}

function createDayElement(day, date, isOtherMonth, isToday = false, isSelected = false) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (isOtherMonth) el.classList.add('other-month');
    if (isToday) el.classList.add('today');
    if (isSelected) el.classList.add('selected');

    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
        el.classList.add('has-events');
    }

    el.innerHTML = `<span>${day}</span>`;

    if (dayEvents.length > 0) {
        const dots = document.createElement('div');
        dots.className = 'event-dots';
        dayEvents.slice(0, 3).forEach(evt => {
            const dot = document.createElement('div');
            dot.className = `event-dot ${evt.category}`;
            dots.appendChild(dot);
        });
        el.appendChild(dots);
    }

    el.addEventListener('click', () => {
        selectedDate = new Date(date);
        renderCalendar();
    });

    return el;
}

function getEventsForDate(date) {
    const dateStr = formatDateInput(date);
    return state.events.filter(e => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

function renderEvents() {
    const list = document.getElementById('eventsList');
    const label = document.getElementById('selectedDateLabel');
    label.textContent = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric'
    });

    const events = getEventsForDate(selectedDate);

    if (events.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">📅</div>No events for this day</div>`;
        return;
    }

    list.innerHTML = events.map(evt => `
        <div class="event-item ${evt.category}" onclick="editEvent('${evt.id}')">
            <div class="event-time">${evt.time ? formatTime(evt.time) : 'All day'}</div>
            <div class="event-info">
                <h4>${escapeHtml(evt.title)}</h4>
                ${evt.description ? `<p>${escapeHtml(evt.description)}</p>` : ''}
            </div>
            <div class="event-actions">
                <button onclick="event.stopPropagation(); deleteEvent('${evt.id}')" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function saveEvent() {
    const id = document.getElementById('eventId').value;
    const title = document.getElementById('eventTitle').value.trim();
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const category = document.getElementById('eventCategory').value;
    const description = document.getElementById('eventDescription').value.trim();

    if (!title || !date) {
        showToast('Please enter a title and date', 'error');
        return;
    }

    if (id) {
        const idx = state.events.findIndex(e => e.id === id);
        if (idx !== -1) {
            state.events[idx] = { ...state.events[idx], title, date, time, category, description };
        }
        showToast('Event updated!');
    } else {
        state.events.push({ id: generateId(), title, date, time, category, description });
        showToast('Event added!');
    }

    saveState();
    closeModal('eventModal');
    renderCalendar();
}

function editEvent(id) {
    const evt = state.events.find(e => e.id === id);
    if (!evt) return;

    document.getElementById('eventId').value = evt.id;
    document.getElementById('eventTitle').value = evt.title;
    document.getElementById('eventDate').value = evt.date;
    document.getElementById('eventTime').value = evt.time || '';
    document.getElementById('eventCategory').value = evt.category;
    document.getElementById('eventDescription').value = evt.description || '';
    document.getElementById('eventModalTitle').textContent = 'Edit Event';
    openModal('eventModal');
}

function deleteEvent(id) {
    if (!confirm('Delete this event?')) return;
    state.events = state.events.filter(e => e.id !== id);
    saveState();
    renderCalendar();
    showToast('Event deleted!', 'info');
}

// ===== NOTES =====
function initNotes() {
    renderNotes();

    document.getElementById('addNoteBtn').addEventListener('click', () => {
        document.getElementById('noteId').value = '';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        document.getElementById('noteCategory').value = 'personal';
        selectedNoteColor = '#fef3c7';
        updateColorPicker();
        document.getElementById('noteModalTitle').textContent = 'New Note';
        document.getElementById('deleteNoteBtn').style.display = 'none';
        openModal('noteModal');
    });

    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('deleteNoteBtn').addEventListener('click', () => {
        const id = document.getElementById('noteId').value;
        if (id && confirm('Delete this note?')) {
            state.notes = state.notes.filter(n => n.id !== id);
            saveState();
            closeModal('noteModal');
            renderNotes();
            showToast('Note deleted!', 'info');
        }
    });

    // Color picker
    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            selectedNoteColor = opt.dataset.color;
            updateColorPicker();
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderNotes(btn.dataset.filter);
        });
    });

    // Search
    document.getElementById('notesSearch').addEventListener('input', (e) => {
        const active = document.querySelector('.filter-btn.active');
        renderNotes(active?.dataset.filter || 'all', e.target.value);
    });
}

function updateColorPicker() {
    document.querySelectorAll('.color-opt').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === selectedNoteColor);
    });
}

function renderNotes(filter = 'all', search = '') {
    const grid = document.getElementById('notesGrid');
    let notes = [...state.notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    if (filter !== 'all') {
        notes = notes.filter(n => n.category === filter);
    }

    if (search) {
        const term = search.toLowerCase();
        notes = notes.filter(n =>
            n.title.toLowerCase().includes(term) ||
            n.content.toLowerCase().includes(term)
        );
    }

    if (notes.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📝</div>No notes yet. Create one!</div>`;
        return;
    }

    grid.innerHTML = notes.map(note => `
        <div class="note-card" style="background: ${note.color || '#fff'}" onclick="editNote('${note.id}')">
            <div class="note-card-header">
                <h4>${escapeHtml(note.title || 'Untitled')}</h4>
                <span class="note-category-badge">${note.category}</span>
            </div>
            <p>${escapeHtml(note.content)}</p>
            <div class="note-card-footer">
                ${timeAgo(note.updatedAt)}
            </div>
        </div>
    `).join('');
}

function saveNote() {
    const id = document.getElementById('noteId').value;
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    const category = document.getElementById('noteCategory').value;

    if (!title && !content) {
        showToast('Please enter a title or content', 'error');
        return;
    }

    const now = new Date().toISOString();

    if (id) {
        const idx = state.notes.findIndex(n => n.id === id);
        if (idx !== -1) {
            state.notes[idx] = { ...state.notes[idx], title, content, category, color: selectedNoteColor, updatedAt: now };
        }
        showToast('Note updated!');
    } else {
        state.notes.push({
            id: generateId(), title, content, category,
            color: selectedNoteColor, createdAt: now, updatedAt: now
        });
        showToast('Note created!');
    }

    saveState();
    closeModal('noteModal');
    renderNotes();
}

function editNote(id) {
    const note = state.notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('noteId').value = note.id;
    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteCategory').value = note.category;
    selectedNoteColor = note.color || '#fef3c7';
    updateColorPicker();
    document.getElementById('noteModalTitle').textContent = 'Edit Note';
    document.getElementById('deleteNoteBtn').style.display = 'block';
    openModal('noteModal');
}

// ===== BUDGET =====
function initBudget() {
    renderBudgetOverview();
    renderSubscriptions();
    renderBills();
    renderAllExpenses();

    // Tabs
    document.querySelectorAll('.budget-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.budget-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.budget-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`budget${capitalize(tab.dataset.tab)}`).classList.add('active');
        });
    });

    // Add expense button
    document.getElementById('addExpenseBtn').addEventListener('click', () => openExpenseModal());
    document.getElementById('addSubscriptionBtn').addEventListener('click', () => openExpenseModal('subscription'));
    document.getElementById('addBillBtn').addEventListener('click', () => openExpenseModal('bill'));

    // Expense type change
    document.getElementById('expenseType').addEventListener('change', (e) => {
        document.querySelector('.subscription-fields').style.display = e.target.value === 'subscription' ? 'block' : 'none';
        document.querySelector('.bill-fields').style.display = e.target.value === 'bill' ? 'block' : 'none';
    });

    document.getElementById('saveExpenseBtn').addEventListener('click', saveExpense);
    document.getElementById('deleteExpenseBtn').addEventListener('click', () => {
        const id = document.getElementById('expenseId').value;
        if (id && confirm('Delete this item?')) {
            state.expenses = state.expenses.filter(e => e.id !== id);
            saveState();
            closeModal('expenseModal');
            refreshBudget();
            showToast('Deleted!', 'info');
        }
    });

    // Income
    document.getElementById('editIncomeBtn').addEventListener('click', () => {
        document.getElementById('incomeInput').value = state.monthlyIncome || '';
        openModal('incomeModal');
    });

    document.getElementById('saveIncomeBtn').addEventListener('click', () => {
        state.monthlyIncome = parseFloat(document.getElementById('incomeInput').value) || 0;
        saveState();
        closeModal('incomeModal');
        renderBudgetOverview();
        showToast('Income updated!');
    });
}

function openExpenseModal(type = 'expense') {
    document.getElementById('expenseId').value = '';
    document.getElementById('expenseType').value = type;
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseDate').value = formatDateInput(new Date());
    document.getElementById('expenseCategorySelect').value = 'other';
    document.getElementById('billingCycle').value = 'monthly';
    document.getElementById('billDueDay').value = '';
    document.getElementById('expensePaid').checked = false;
    document.getElementById('expenseModalTitle').textContent = 'Add ' + capitalize(type);
    document.getElementById('deleteExpenseBtn').style.display = 'none';

    document.querySelector('.subscription-fields').style.display = type === 'subscription' ? 'block' : 'none';
    document.querySelector('.bill-fields').style.display = type === 'bill' ? 'block' : 'none';

    openModal('expenseModal');
}

function saveExpense() {
    const id = document.getElementById('expenseId').value;
    const type = document.getElementById('expenseType').value;
    const name = document.getElementById('expenseName').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const category = document.getElementById('expenseCategorySelect').value;
    const paid = document.getElementById('expensePaid').checked;
    const billingCycle = document.getElementById('billingCycle').value;
    const dueDay = parseInt(document.getElementById('billDueDay').value) || null;

    if (!name || !amount) {
        showToast('Please enter name and amount', 'error');
        return;
    }

    const expenseData = { type, name, amount, date, category, paid, billingCycle, dueDay };

    if (id) {
        const idx = state.expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            state.expenses[idx] = { ...state.expenses[idx], ...expenseData };
        }
        showToast('Updated!');
    } else {
        state.expenses.push({ id: generateId(), ...expenseData, createdAt: new Date().toISOString() });
        showToast('Added!');
    }

    saveState();
    closeModal('expenseModal');
    refreshBudget();
}

function editExpense(id) {
    const exp = state.expenses.find(e => e.id === id);
    if (!exp) return;

    document.getElementById('expenseId').value = exp.id;
    document.getElementById('expenseType').value = exp.type;
    document.getElementById('expenseName').value = exp.name;
    document.getElementById('expenseAmount').value = exp.amount;
    document.getElementById('expenseDate').value = exp.date;
    document.getElementById('expenseCategorySelect').value = exp.category;
    document.getElementById('expensePaid').checked = exp.paid;
    document.getElementById('billingCycle').value = exp.billingCycle || 'monthly';
    document.getElementById('billDueDay').value = exp.dueDay || '';
    document.getElementById('expenseModalTitle').textContent = 'Edit ' + capitalize(exp.type);
    document.getElementById('deleteExpenseBtn').style.display = 'block';

    document.querySelector('.subscription-fields').style.display = exp.type === 'subscription' ? 'block' : 'none';
    document.querySelector('.bill-fields').style.display = exp.type === 'bill' ? 'block' : 'none';

    openModal('expenseModal');
}

function togglePaid(id) {
    const exp = state.expenses.find(e => e.id === id);
    if (exp) {
        exp.paid = !exp.paid;
        saveState();
        refreshBudget();
    }
}

function refreshBudget() {
    renderBudgetOverview();
    renderSubscriptions();
    renderBills();
    renderAllExpenses();
}

function renderBudgetOverview() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = state.expenses.filter(e => {
        if (e.type === 'subscription') return true; // Always count active subscriptions
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalExpenses = monthExpenses.reduce((sum, e) => {
        if (e.type === 'subscription') {
            if (e.billingCycle === 'yearly') return sum + e.amount / 12;
            if (e.billingCycle === 'weekly') return sum + e.amount * 4.33;
            return sum + e.amount;
        }
        return sum + e.amount;
    }, 0);

    const totalSubs = state.expenses
        .filter(e => e.type === 'subscription')
        .reduce((sum, e) => sum + e.amount, 0);

    document.getElementById('monthlyIncome').textContent = `$${state.monthlyIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('remainingBudget').textContent = `$${(state.monthlyIncome - totalExpenses).toFixed(2)}`;
    document.getElementById('totalSubscriptions').textContent = `$${totalSubs.toFixed(2)}/mo`;

    // Category breakdown
    const categoryIcons = {
        housing: '🏠', utilities: '⚡', food: '🍕', transport: '🚗',
        entertainment: '🎬', health: '🏥', shopping: '🛍️', education: '📚', other: '📦'
    };

    const categoryColors = {
        housing: '#6366f1', utilities: '#f59e0b', food: '#10b981', transport: '#3b82f6',
        entertainment: '#ec4899', health: '#ef4444', shopping: '#8b5cf6', education: '#06b6d4', other: '#64748b'
    };

    const categoryTotals = {};
    monthExpenses.forEach(e => {
        let amount = e.amount;
        if (e.type === 'subscription' && e.billingCycle === 'yearly') amount = e.amount / 12;
        if (e.type === 'subscription' && e.billingCycle === 'weekly') amount = e.amount * 4.33;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amount;
    });

    const maxAmount = Math.max(...Object.values(categoryTotals), 1);
    const breakdownEl = document.getElementById('categoryBreakdown');

    if (Object.keys(categoryTotals).length === 0) {
        breakdownEl.innerHTML = '<div class="empty-state">No expenses yet</div>';
    } else {
        breakdownEl.innerHTML = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => `
                <div class="category-bar-item">
                    <div class="category-bar-label">${categoryIcons[cat] || '📦'} ${capitalize(cat)}</div>
                    <div class="category-bar-track">
                        <div class="category-bar-fill" style="width: ${(amount / maxAmount) * 100}%; background: ${categoryColors[cat] || '#64748b'}"></div>
                    </div>
                    <div class="category-bar-amount">$${amount.toFixed(2)}</div>
                </div>
            `).join('');
    }
}

function renderSubscriptions() {
    const list = document.getElementById('subscriptionsList');
    const subs = state.expenses.filter(e => e.type === 'subscription');

    if (subs.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">🔄</div>No subscriptions yet</div>';
        return;
    }

    list.innerHTML = subs.map(sub => `
        <div class="budget-item">
            <div class="budget-item-info">
                <div class="budget-item-icon">${getCategoryIcon(sub.category)}</div>
                <div class="budget-item-details">
                    <h4>${escapeHtml(sub.name)}</h4>
                    <p>${capitalize(sub.billingCycle || 'monthly')} • ${capitalize(sub.category)}</p>
                </div>
            </div>
            <div class="budget-item-right">
                <span class="budget-item-amount">$${sub.amount.toFixed(2)}</span>
                <span class="paid-badge ${sub.paid ? 'paid' : 'unpaid'}" onclick="togglePaid('${sub.id}')" style="cursor:pointer">
                    ${sub.paid ? 'Active' : 'Paused'}
                </span>
                <div class="budget-item-actions">
                    <button onclick="editExpense('${sub.id}')" title="Edit">✏️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderBills() {
    const list = document.getElementById('billsList');
    const bills = state.expenses.filter(e => e.type === 'bill');

    if (bills.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div>No bills yet</div>';
        return;
    }

    list.innerHTML = bills.map(bill => `
        <div class="budget-item">
            <div class="budget-item-info">
                <div class="budget-item-icon">${getCategoryIcon(bill.category)}</div>
                <div class="budget-item-details">
                    <h4>${escapeHtml(bill.name)}</h4>
                    <p>${bill.dueDay ? `Due: Day ${bill.dueDay}` : ''} • ${capitalize(bill.category)}</p>
                </div>
            </div>
            <div class="budget-item-right">
                <span class="budget-item-amount">$${bill.amount.toFixed(2)}</span>
                <span class="paid-badge ${bill.paid ? 'paid' : 'unpaid'}" onclick="togglePaid('${bill.id}')" style="cursor:pointer">
                    ${bill.paid ? 'Paid' : 'Unpaid'}
                </span>
                <div class="budget-item-actions">
                    <button onclick="editExpense('${bill.id}')" title="Edit">✏️</button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderAllExpenses() {
    const list = document.getElementById('expensesList');
    const sorted = [...state.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sorted.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-icon">💰</div>No expenses yet</div>';
        return;
    }

    list.innerHTML = sorted.map(exp => `
        <div class="budget-item">
            <div class="budget-item-info">
                <div class="budget-item-icon">${getCategoryIcon(exp.category)}</div>
                <div class="budget-item-details">
                    <h4>${escapeHtml(exp.name)}</h4>
                    <p>${capitalize(exp.type)} • ${capitalize(exp.category)} • ${formatDisplayDate(exp.date)}</p>
                </div>
            </div>
            <div class="budget-item-right">
                <span class="budget-item-amount">$${exp.amount.toFixed(2)}</span>
                <span class="paid-badge ${exp.paid ? 'paid' : 'unpaid'}" onclick="togglePaid('${exp.id}')" style="cursor:pointer">
                    ${exp.paid ? 'Paid' : 'Unpaid'}
                </span>
                <div class="budget-item-actions">
                    <button onclick="editExpense('${exp.id}')" title="Edit">✏️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ===== SHOPPING =====
function initShopping() {
    renderShoppingList();
    renderGroceryList();

    // Shopping tabs
    document.querySelectorAll('.shopping-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.shopping-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.shopping-panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`${tab.dataset.tab}Panel`).classList.add('active');
        });
    });

    // Add shopping item
    document.getElementById('addShoppingItem').addEventListener('click', addShoppingItem);
    document.getElementById('shoppingItemInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addShoppingItem();
    });

    // Add grocery item
    document.getElementById('addGroceryItem').addEventListener('click', addGroceryItem);
    document.getElementById('groceryItemInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addGroceryItem();
    });

    // Clear completed
    document.getElementById('clearCompletedShopping').addEventListener('click', () => {
        state.shoppingItems = state.shoppingItems.filter(i => !i.completed);
        saveState();
        renderShoppingList();
        showToast('Cleared completed items', 'info');
    });

    document.getElementById('clearCompletedGrocery').addEventListener('click', () => {
        state.groceryItems = state.groceryItems.filter(i => !i.completed);
        saveState();
        renderGroceryList();
        showToast('Cleared completed items', 'info');
    });
}

function addShoppingItem() {
    const input = document.getElementById('shoppingItemInput');
    const name = input.value.trim();
    const priority = document.getElementById('shoppingPriority').value;
    const price = parseFloat(document.getElementById('shoppingItemPrice').value) || 0;

    if (!name) return;

    state.shoppingItems.push({
        id: generateId(), name, priority, price, completed: false, createdAt: new Date().toISOString()
    });

    saveState();
    input.value = '';
    document.getElementById('shoppingItemPrice').value = '';
    renderShoppingList();
    showToast('Item added!');
}

function renderShoppingList() {
    const container = document.getElementById('shoppingItems');
    const items = state.shoppingItems.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const priorityOrder = { urgent: 0, normal: 1, low: 2 };
        return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1);
    });

    // Stats
    document.getElementById('shoppingTotal').textContent = items.length;
    document.getElementById('shoppingCompleted').textContent = items.filter(i => i.completed).length;
    document.getElementById('shoppingEstTotal').textContent = `$${items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2)}`;

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🛒</div>Your shopping list is empty</div>';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="checklist-item ${item.completed ? 'completed' : ''}">
            <div class="check-box ${item.completed ? 'checked' : ''}" onclick="toggleShoppingItem('${item.id}')">
                ${item.completed ? '✓' : ''}
            </div>
            <span class="check-label">${escapeHtml(item.name)}</span>
            <div class="check-meta">
                ${item.price ? `<span>$${item.price.toFixed(2)}</span>` : ''}
                <span class="priority-badge ${item.priority}">${item.priority}</span>
            </div>
            <button class="delete-btn" onclick="deleteShoppingItem('${item.id}')">🗑️</button>
        </div>
    `).join('');
}

function toggleShoppingItem(id) {
    const item = state.shoppingItems.find(i => i.id === id);
    if (item) {
        item.completed = !item.completed;
        saveState();
        renderShoppingList();
    }
}

function deleteShoppingItem(id) {
    state.shoppingItems = state.shoppingItems.filter(i => i.id !== id);
    saveState();
    renderShoppingList();
}

function addGroceryItem() {
    const input = document.getElementById('groceryItemInput');
    const name = input.value.trim();
    const category = document.getElementById('groceryCategory').value;
    const quantity = parseInt(document.getElementById('groceryQuantity').value) || 1;

    if (!name) return;

    state.groceryItems.push({
        id: generateId(), name, category, quantity, completed: false, createdAt: new Date().toISOString()
    });

    saveState();
    input.value = '';
    document.getElementById('groceryQuantity').value = '1';
    renderGroceryList();
    showToast('Item added!');
}

function renderGroceryList() {
    const container = document.getElementById('groceryItems');

    // Stats
    document.getElementById('groceryTotal').textContent = state.groceryItems.length;
    document.getElementById('groceryCompleted').textContent = state.groceryItems.filter(i => i.completed).length;

    if (state.groceryItems.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">🥬</div>Your grocery list is empty</div>';
        return;
    }

    const categoryNames = {
        produce: '🥬 Produce', dairy: '🥛 Dairy', meat: '🥩 Meat',
        bakery: '🍞 Bakery', frozen: '🧊 Frozen', beverages: '🥤 Beverages',
        snacks: '🍿 Snacks', household: '🧹 Household', other: '📦 Other'
    };

    // Group by category
    const grouped = {};
    state.groceryItems.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    let html = '';
    Object.entries(grouped).forEach(([cat, items]) => {
        items.sort((a, b) => a.completed - b.completed);
        html += `<div class="grocery-category-header">${categoryNames[cat] || cat}</div>`;
        items.forEach(item => {
            html += `
                <div class="checklist-item ${item.completed ? 'completed' : ''}">
                    <div class="check-box ${item.completed ? 'checked' : ''}" onclick="toggleGroceryItem('${item.id}')">
                        ${item.completed ? '✓' : ''}
                    </div>
                    <span class="check-label">${escapeHtml(item.name)}</span>
                    <div class="check-meta">
                        <span>x${item.quantity}</span>
                    </div>
                    <button class="delete-btn" onclick="deleteGroceryItem('${item.id}')">🗑️</button>
                </div>
            `;
        });
    });

    container.innerHTML = html;
}

function toggleGroceryItem(id) {
    const item = state.groceryItems.find(i => i.id === id);
    if (item) {
        item.completed = !item.completed;
        saveState();
        renderGroceryList();
    }
}

function deleteGroceryItem(id) {
    state.groceryItems = state.groceryItems.filter(i => i.id !== id);
    saveState();
    renderGroceryList();
}

// ===== DASHBOARD =====
function updateDashboard() {
    // Upcoming events
    const upcomingEl = document.getElementById('dashUpcomingEvents');
    const today = formatDateInput(new Date());
    const upcoming = state.events
        .filter(e => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
        .slice(0, 4);

    if (upcoming.length === 0) {
        upcomingEl.innerHTML = '<div class="empty-state">No upcoming events</div>';
    } else {
        upcomingEl.innerHTML = upcoming.map(e => `
            <div class="dash-list-item">
                <span class="item-label"><span class="event-dot ${e.category}" style="display:inline-block;width:8px;height:8px;border-radius:50%;"></span> ${escapeHtml(e.title)}</span>
                <span class="item-value">${formatDisplayDate(e.date)}</span>
            </div>
        `).join('');
    }

    // Recent notes
    const notesEl = document.getElementById('dashRecentNotes');
    const recentNotes = [...state.notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 4);

    if (recentNotes.length === 0) {
        notesEl.innerHTML = '<div class="empty-state">No notes yet</div>';
    } else {
        notesEl.innerHTML = recentNotes.map(n => `
            <div class="dash-list-item">
                <span class="item-label">${escapeHtml(n.title || 'Untitled')}</span>
                <span class="item-value">${timeAgo(n.updatedAt)}</span>
            </div>
        `).join('');
    }

    // Budget summary
    const budgetEl = document.getElementById('dashBudgetSummary');
    const totalExp = state.expenses.reduce((s, e) => s + e.amount, 0);
    const unpaidBills = state.expenses.filter(e => e.type === 'bill' && !e.paid);

    budgetEl.innerHTML = `
        <div class="dash-list-item">
            <span class="item-label">💵 Income</span>
            <span class="item-value" style="color: #10b981">$${state.monthlyIncome.toFixed(2)}</span>
        </div>
        <div class="dash-list-item">
            <span class="item-label">💸 Expenses</span>
            <span class="item-value" style="color: #ef4444">$${totalExp.toFixed(2)}</span>
        </div>
        <div class="dash-list-item">
            <span class="item-label">📋 Unpaid Bills</span>
            <span class="item-value">${unpaidBills.length}</span>
        </div>
    `;

    // Shopping preview
    const shopEl = document.getElementById('dashShoppingPreview');
    const pendingItems = state.shoppingItems.filter(i => !i.completed).slice(0, 4);
    const pendingGroceries = state.groceryItems.filter(i => !i.completed).length;

    if (pendingItems.length === 0 && pendingGroceries === 0) {
        shopEl.innerHTML = '<div class="empty-state">All done! 🎉</div>';
    } else {
        let html = pendingItems.map(i => `
            <div class="dash-list-item">
                <span class="item-label">🛒 ${escapeHtml(i.name)}</span>
                <span class="priority-badge ${i.priority}" style="font-size:10px">${i.priority}</span>
            </div>
        `).join('');
        if (pendingGroceries > 0) {
            html += `<div class="dash-list-item"><span class="item-label">🥬 ${pendingGroceries} grocery items remaining</span></div>`;
        }
        shopEl.innerHTML = html;
    }

    // Spending chart (last 6 months)
    renderSpendingChart();
}

function renderSpendingChart() {
    const chart = document.getElementById('spendingChart');
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const month = d.getMonth();
        const year = d.getFullYear();
        const label = d.toLocaleDateString('en-US', { month: 'short' });

        const total = state.expenses
            .filter(e => {
                if (e.type === 'subscription') {
                    return true; // Count for all months
                }
                const ed = new Date(e.date);
                return ed.getMonth() === month && ed.getFullYear() === year;
            })
            .reduce((sum, e) => {
                if (e.type === 'subscription') {
                    if (e.billingCycle === 'yearly') return sum + e.amount / 12;
                    return sum + e.amount;
                }
                return sum + e.amount;
            }, 0);

        months.push({ label, total });
    }

    const maxVal = Math.max(...months.map(m => m.total), 1);

    chart.innerHTML = months.map(m => `
        <div class="chart-bar-wrapper">
            <div class="chart-bar-value">$${m.total.toFixed(0)}</div>
            <div class="chart-bar" style="height: ${(m.total / maxVal) * 100}%"></div>
            <div class="chart-bar-label">${m.label}</div>
        </div>
    `).join('');
}

// ===== UTILITY FUNCTIONS =====
function formatDateInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getCategoryIcon(category) {
    const icons = {
        housing: '🏠', utilities: '⚡', food: '🍕', transport: '🚗',
        entertainment: '🎬', health: '🏥', shopping: '🛍️', education: '📚', other: '📦'
    };
    return icons[category] || '📦';
}

// ===== Global Search =====
document.getElementById('globalSearch')?.addEventListener('input', function (e) {
    const term = e.target.value.toLowerCase().trim();
    if (!term) return;

    // Simple search - navigate to relevant section based on first match
    const eventMatch = state.events.find(e => e.title.toLowerCase().includes(term));
    const noteMatch = state.notes.find(n =>
        n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
    );

    if (eventMatch) {
        switchSection('calendar');
        document.querySelectorAll('.nav-item').forEach(n =>
            n.classList.toggle('active', n.dataset.section === 'calendar')
        );
    } else if (noteMatch) {
        switchSection('notes');
        document.querySelectorAll('.nav-item').forEach(n =>
            n.classList.toggle('active', n.dataset.section === 'notes')
        );
        document.getElementById('notesSearch').value = term;
        renderNotes('all', term);
    }
});