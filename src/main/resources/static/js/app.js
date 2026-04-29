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

// DOM Elements (Pegando as caixinhas e tabelas do HTML para o JS conseguir alterar o que está escrito nelas)
const form = document.getElementById('transaction-form');
const transactionList = document.getElementById('transaction-list');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const balanceTotalEl = document.getElementById('balance-total');

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
            render(); // Manda desenhar a tabela e os cards de saldo na tela
        } else {
            console.error('Failed to fetch transactions');
        }
    } catch (error) {
        console.error('API Error:', error);
    }
};

// Add Transaction (Ouvinte de evento: Quando o usuário clicar em "Adicionar" no formulário)
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de recarregar sozinha (comportamento padrão do HTML)

    // Monta o "pacotinho" de dados pegando o que foi digitado nos campos
    const newTransaction = {
        description: document.getElementById('desc').value,
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        date: document.getElementById('date').value,
        category: document.getElementById('category').value,
        userId: currentUser.id // Manda também de qual usuário é essa transação!
    };

    try {
        // Faz o POST, enviando o nosso pacotinho no formato JSON pro Java salvar
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTransaction)
        });

        if (response.ok) {
            const savedTransaction = await response.json(); // O Java devolve a transação com o ID gerado pelo banco
            transactions.unshift(savedTransaction); // Coloca na primeira posição da nossa lista
            await fetchTransactions(); // Busca de novo no Java pra ter certeza que tá sincronizado
            form.reset(); // Limpa os campos do formulário pro usuário digitar o próximo
        }
    } catch (error) {
        console.error('Error saving transaction:', error);
    }
});

// Delete Transaction (Quando clicar no ícone de lixeira)
const deleteTransaction = async (id) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return; // Confirmação de segurança

    try {
        // Manda um DELETE pro Java dizendo o ID da transação na URL
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            // Remove a transação apagada da nossa lista no JavaScript
            transactions = transactions.filter(t => t.id !== id);
            render(); // Manda desenhar tudo de novo (agora sem ela)
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
    }
};

// Render UI Components (Manda desenhar a lista e os saldos)
const render = () => {
    renderList();
    renderSummary();
};

// Render List (Pega a tabela HTML vazia e injeta os itens dentro)
const renderList = () => {
    transactionList.innerHTML = ''; // Limpa a tabela
    
    // Se não tiver transações, mostra uma mensagem amigável
    if (transactions.length === 0) {
        transactionList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhuma transação encontrada.</td></tr>`;
        return;
    }

    // Para cada transação, cria uma linha (<tr>) na tabela e joga as informações nos quadradinhos (<td>)
    transactions.forEach(t => {
        const amountClass = t.type === 'RECEITA' ? 'type-receita' : 'type-despesa';
        const sign = t.type === 'RECEITA' ? '+' : '-';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.description}</td>
            <td><span class="category-tag">${t.category}</span></td>
            <td>${formatDate(t.date)}</td>
            <td class="${amountClass}">${sign} ${formatCurrency(t.amount)}</td>
            <td>
                <button class="btn-delete" onclick="deleteTransaction(${t.id})">
                    <i class="ph-bold ph-trash"></i>
                </button>
            </td>
        `;
        transactionList.appendChild(tr); // Gruda a linha na tabela
    });
};

// Calculate and render Summary (Faz a conta de matemática de Receitas e Despesas)
const renderSummary = () => {
    // Pega só as que são RECEITA e soma o valor
    const income = transactions
        .filter(t => t.type === 'RECEITA')
        .reduce((sum, t) => sum + t.amount, 0);

    // Pega só as que são DESPESA e soma o valor
    const expense = transactions
        .filter(t => t.type === 'DESPESA')
        .reduce((sum, t) => sum + t.amount, 0);

    // Calcula o que sobrou no bolso
    const balance = income - expense;

    // Joga os valores formatados para reais lá nos Cartões (Cards) superiores
    incomeTotalEl.textContent = formatCurrency(income);
    expenseTotalEl.textContent = formatCurrency(expense);
    balanceTotalEl.textContent = formatCurrency(balance);
};

// Dá o "Start" na aplicação toda
init();
