package com.example.demo.controller;

import com.example.demo.model.Transaction;
import com.example.demo.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Controlador responsável por ouvir as requisições de Transações (Extrato, Nova Despesa, etc)
@RestController
@RequestMapping("/api/transactions") // O endereço base no navegador/Javascript será sempre /api/transactions
@CrossOrigin(origins = "*") // Permite que o Frontend no localhost acesse esse Backend sem dar erro de CORS
public class TransactionController {

    @Autowired
    private TransactionRepository repository; // Nosso "estoquista" do banco de dados

    // @GetMapping indica que essa função roda quando fazemos um GET (ou seja, quando apenas PEDIMOS dados)
    @GetMapping
    // @RequestParam avisa que pode vir um "userId=X" na URL da requisição
    public List<Transaction> getAllTransactions(@RequestParam(required = false) Long userId) {
        // Se o Javascript enviou o ID do usuário, a gente busca no banco SÓ as transações daquele usuário
        if (userId != null) {
            return repository.findAllByUserIdOrderByDateDesc(userId);
        }
        // Se não enviou, devolve tudo (Comportamento antigo, antes da tela de login)
        return repository.findAllByOrderByDateDesc();
    }

    // @PostMapping roda quando o Javascript manda dados via POST (para CRIAR algo no banco)
    @PostMapping
    public Transaction createTransaction(@RequestBody Transaction transaction) {
        // Pega a transação que o JS enviou, manda o repositório salvar no banco e devolve a transação salva (já com o ID novo gerado)
        return repository.save(transaction);
    }

    // @DeleteMapping roda quando o Javascript pede para DELETAR. O "{id}" na URL vai indicar qual transação deletar.
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id) {
        // Procura no banco se a transação existe
        return repository.findById(id).map(transaction -> {
            repository.delete(transaction); // Se achar, deleta!
            return ResponseEntity.ok().build(); // Retorna OK pro Javascript
        }).orElse(ResponseEntity.notFound().build()); // Se não achar, retorna 404 Not Found (Não Encontrado)
    }
}
