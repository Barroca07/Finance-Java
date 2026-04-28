package com.example.demo.repository;

import com.example.demo.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// @Repository indica que esta interface cuida do acesso aos dados das transações
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    
    // Busca TODAS as transações de todo mundo (usado antes de separarmos por usuário)
    List<Transaction> findAllByOrderByDateDesc();
    
    // A mágica do Spring de novo: "Buscar Todas Por UserId Ordenado Por Data Decrescente"
    // O Spring lê esse nome longo de método e cria o SELECT automático no banco!
    List<Transaction> findAllByUserIdOrderByDateDesc(Long userId);
}
