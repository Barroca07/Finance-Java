// User Session Management (Gerenciamento da Sessão do Usuário)
// A primeira coisa que o Dashboard faz é olhar a "memória" do navegador (localStorage)
const userStr = localStorage.getItem('user');
if (!userStr) {
    // Se não tiver usuário salvo, expulsa a pessoa de volta pra tela de login
    window.location.href = 'login.html';
}
// Se chegou aqui, transforma o texto salvo em um objeto Javascript pra podermos usar
const currentUser = JSON.parse(userStr);

// Esse é o endereço de onde o Java está rodando. É com ele que vamos conversar!
const API_URL = 'https://finance-java.onrender.com/api/transactions';

// State (Onde guardamos a lista de transações temporariamente no JavaScript)
let transactions = [];
let filteredTransactions = [];
let editingTransactionId = null;
let currentMonthFilter = '';
let categoryChart = null;
let currentPage = 1;
const itemsPerPage = 6;
let transactionToDelete = null;

// DOM Elements (Pegando as caixinhas e tabelas do HTML para o JS conseguir alterar o que está escrito nelas)
const form = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const balanceTotalEl = document.getElementById('balance-total');
const paginationControls = document.getElementById('pagination-controls');

const deleteModal = document.getElementById('delete-modal');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-transaction-form');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

// Listeners do Modal de Exclusão
if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.style.display = 'none';
        transactionToDelete = null;
    });
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!transactionToDelete) return;

        try {
            const response = await fetch(`${API_URL}/${transactionToDelete}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                transactions = transactions.filter(t => t.id !== transactionToDelete);
                applyFilterAndRender();
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        } finally {
            deleteModal.style.display = 'none';
            transactionToDelete = null;
        }
    });
}

// Função para formatar números para o formato de Real (R$ 10,00)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Função para formatar a data que vem do banco (Ex: 2026-12-31 vira 31/12/2026)
const formatDate = (dateString) => {
    const parts = dateString.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// Start App (Função que roda assim que a página termina de carregar)
const init = async () => {
    // Configura o filtro de mês inicial para o mês corrente
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();
    currentMonthFilter = `${currentYear}-${currentMonth}`;
    
    const monthFilterEl = document.getElementById('month-filter');
    if (monthFilterEl) {
        monthFilterEl.value = currentMonthFilter;
        monthFilterEl.addEventListener('change', (e) => {
            currentMonthFilter = e.target.value;
            applyFilterAndRender();
        });

        // Lógica dos botões de < e >
        const updateMonth = (increment) => {
            if (!currentMonthFilter) return;
            const [yearStr, monthStr] = currentMonthFilter.split('-');
            let date = new Date(parseInt(yearStr), parseInt(monthStr) - 1 + increment, 1);
            const newMonth = String(date.getMonth() + 1).padStart(2, '0');
            const newYear = date.getFullYear();
            currentMonthFilter = `${newYear}-${newMonth}`;
            monthFilterEl.value = currentMonthFilter;
            applyFilterAndRender();
        };

        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        if (prevBtn) prevBtn.addEventListener('click', () => updateMonth(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => updateMonth(1));
    }

    // Coloca as iniciais do usuário no canto superior direito (Avatar)
    if (currentUser) {
        const initials = currentUser.name.substring(0, 2).toUpperCase();
        const avatar = document.querySelector('.avatar');
        if (avatar) avatar.textContent = initials;
    }
    // Pede pro Java buscar as transações desse usuário
    await fetchTransactions();
};

// Função de sair: Apaga a "memória" e joga pro login
const logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
};

// Fetch from API (Busca no Banco de Dados)
const fetchTransactions = async () => {
    try {
        // Manda um GET pro Java avisando: "Me dê as transações deste userId!"
        const response = await fetch(`${API_URL}?userId=${currentUser.id}`);
        if (response.ok) {
            transactions = await response.json(); // Pega o JSON do Java e salva na nossa lista local
            applyFilterAndRender(); // Aplica o filtro e desenha a tela
        } else {
            console.error('Failed to fetch transactions');
        }
    } catch (error) {
        console.error('API Error:', error);
    }
};

// Add Transaction (Ouvinte de evento: Quando o usuário enviar o formulário principal)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const transactionData = {
        description: document.getElementById('desc').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        userId: currentUser.id
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionData)
        });

        if (response.ok) {
            await fetchTransactions();
            form.reset();
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
});

// Edit Modal Listeners
const closeEditModal = () => {
    if (editModal) editModal.style.display = 'none';
    editingTransactionId = null;
    if (editForm) editForm.reset();
};

if (document.getElementById('close-edit-modal-btn')) {
    document.getElementById('close-edit-modal-btn').addEventListener('click', closeEditModal);
}
if (document.getElementById('cancel-edit-btn')) {
    document.getElementById('cancel-edit-btn').addEventListener('click', closeEditModal);
}

// Edit Form Submit
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!editingTransactionId) return;

        const transactionData = {
            description: document.getElementById('edit-desc').value,
            amount: parseFloat(document.getElementById('edit-amount').value),
            type: document.getElementById('edit-type').value,
            date: document.getElementById('edit-date').value,
            category: document.getElementById('edit-category').value,
            userId: currentUser.id
        };

        try {
            const response = await fetch(`${API_URL}/${editingTransactionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transactionData)
            });
            
            if (response.ok) {
                await fetchTransactions();
                closeEditModal();
            }
        } catch (error) {
            console.error('Error updating transaction:', error);
        }
    });
}

// Edit Transaction (Abre o modal de edição e preenche os campos)
const editTransaction = (id) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    editingTransactionId = id;

    // Preenche os campos do modal
    document.getElementById('edit-desc').value = transaction.description;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-date').value = transaction.date;
    document.getElementById('edit-category').value = transaction.category;

    if (editModal) {
        editModal.style.display = 'flex';
    }
};

// Delete Transaction (Abre o modal de confirmação)
const deleteTransaction = (id) => {
    transactionToDelete = id;
    if (deleteModal) {
        deleteModal.style.display = 'flex';
    }
};

// Filter Logic
const applyFilterAndRender = () => {
    if (currentMonthFilter) {
        filteredTransactions = transactions.filter(t => t.date.startsWith(currentMonthFilter));
    } else {
        filteredTransactions = [...transactions];
    }
    currentPage = 1;
    render();
};

// Render UI Components (Manda desenhar a lista e os saldos)
const render = () => {
    renderList();
    renderSummary();
    renderChart();
};

// Render List (Pega a tabela HTML vazia e injeta os itens dentro)
const renderList = () => {
    transactionList.innerHTML = ''; // Limpa a tabela
    
    // Se não tiver transações no mês, mostra uma mensagem
    if (filteredTransactions.length === 0) {
        transactionList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhuma transação encontrada no período.</td></tr>`;
        if (paginationControls) paginationControls.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Para cada transação filtrada e paginada, cria uma linha (<tr>)
    paginatedTransactions.forEach(t => {
        const amountClass = t.type === 'RECEITA' ? 'type-receita' : 'type-despesa';
        const sign = t.type === 'RECEITA' ? '+' : '-';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.description}</td>
            <td><span class="category-tag">${t.category}</span></td>
            <td>${formatDate(t.date)}</td>
            <td class="${amountClass}">${sign} ${formatCurrency(t.amount)}</td>
            <td>
                <button class="btn-edit" onclick="editTransaction(${t.id})" title="Editar">
                    <i class="ph-bold ph-pencil-simple"></i>
                </button>
                <button class="btn-delete" onclick="deleteTransaction(${t.id})" title="Excluir">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        `;
        transactionList.appendChild(tr);
    });
    
    renderPaginationControls(totalPages);
};

const renderPaginationControls = (totalPages) => {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="ph-bold ph-caret-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.style.cssText = `background: rgba(255, 255, 255, 0.1); border: none; color: ${prevBtn.disabled ? '#64748b' : 'var(--text-primary)'}; padding: 8px 12px; border-radius: 8px; cursor: ${prevBtn.disabled ? 'not-allowed' : 'pointer'}; transition: background 0.2s;`;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderList();
        }
    };
    paginationControls.appendChild(prevBtn);

    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    pageInfo.style.cssText = 'color: var(--text-secondary); font-size: 0.9rem; font-family: "Inter", sans-serif;';
    paginationControls.appendChild(pageInfo);

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="ph-bold ph-caret-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.style.cssText = `background: rgba(255, 255, 255, 0.1); border: none; color: ${nextBtn.disabled ? '#64748b' : 'var(--text-primary)'}; padding: 8px 12px; border-radius: 8px; cursor: ${nextBtn.disabled ? 'not-allowed' : 'pointer'}; transition: background 0.2s;`;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderList();
        }
    };
    paginationControls.appendChild(nextBtn);
};

// Calculate and render Summary
const renderSummary = () => {
    const income = filteredTransactions
        .filter(t => t.type === 'RECEITA')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = filteredTransactions
        .filter(t => t.type === 'DESPESA')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    incomeTotalEl.textContent = formatCurrency(income);
    expenseTotalEl.textContent = formatCurrency(expense);
    balanceTotalEl.textContent = formatCurrency(balance);
};

// Render Category Chart
const renderChart = () => {
    const ctx = document.getElementById('category-chart');
    if (!ctx) return;

    // Calcula os gastos por categoria
    const expensesByCategory = {};
    filteredTransactions.forEach(t => {
        if (t.type === 'DESPESA') {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        }
    });

    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);

    // Se já houver um gráfico desenhado, a gente destrói para criar o novo atualizado
    if (categoryChart) {
        categoryChart.destroy();
    }

    // Tabela de cores padrão
    const categoryColors = {
        'CASA': '#3b82f6', // blue
        'ALIMENTACAO': '#10b981', // emerald
        'TRANSPORTE': '#f59e0b', // amber
        'LAZER': '#8b5cf6', // violet
        'SALARIO': '#14b8a6', // teal
        'ESTUDOS': '#38bdf8', // sky
        'OUTROS': '#64748b' // slate
    };

    const backgroundColors = labels.map(label => categoryColors[label] || '#94a3b8');

    categoryChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            family: "'Inter', sans-serif"
                        },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.raw !== null) {
                                label += formatCurrency(context.raw);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
};

// Dá o "Start" na aplicação toda
init();
