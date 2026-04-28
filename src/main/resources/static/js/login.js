// Endereço da API Java que cuida dos usuários
const API_URL = 'http://localhost:8082/api/users';

// Função para alternar visualmente entre "Formulário de Login" e "Formulário de Cadastro"
function toggleForm() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm.style.display === 'none') {
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
    }
}

// O que acontece quando o usuário clica em "Entrar" (Login)
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede a página de dar "refresh"
    
    // Pega os textos que o usuário digitou
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        // Envia um pacote de dados (POST) pro Java tentar fazer o login
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }) // Transforma as variáveis num texto JSON
        });

        // Se o Java respondeu "200 OK", o login deu certo!
        if (response.ok) {
            const user = await response.json(); // Pega os dados do usuário (id e nome) que o Java devolveu
            localStorage.setItem('user', JSON.stringify(user)); // Guarda isso na "memória" do navegador
            window.location.href = 'index.html'; // Pula pro Dashboard
        } else {
            // Se o Java negou (senha errada), mostra o erro na tela vermelhinha
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Usuário ou senha inválidos.';
        }
    } catch (error) {
        // Se o Java estiver desligado, cai aqui
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Erro de conexão com o servidor. O Java está ligado?';
    }
});

// O que acontece quando o usuário clica em "Cadastrar"
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const errorDiv = document.getElementById('register-error');

    try {
        // Envia o POST pra rota de Cadastro
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password })
        });

        if (response.ok) {
            // Conta criada com sucesso! Já guarda na memória e vai pro app
            const user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
            window.location.href = 'index.html';
        } else if (response.status === 409) {
            // 409 é o código HTTP para "Conflito" (Nós programamos o Java pra devolver isso se o nome de usuário já existir)
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Nome de usuário já existe. Escolha outro.';
        } else {
            errorDiv.style.display = 'block';
            errorDiv.textContent = 'Erro ao cadastrar usuário.';
        }
    } catch (error) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Erro de conexão com o servidor. O Java está ligado?';
    }
});

// Escudo de Segurança: Se você abriu o login.html mas JÁ ESTAVA LOGADO, ele te joga direto pro dashboard pra você não ter que logar de novo
if (localStorage.getItem('user')) {
    window.location.href = 'index.html';
}
