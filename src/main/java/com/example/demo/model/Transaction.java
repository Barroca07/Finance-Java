package com.example.demo.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

// Entidade que representa a tabela "transactions" (Transações financeiras) no banco de dados.
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Descrição do gasto (Ex: "Conta de Luz")
    @Column(nullable = false)
    private String description;

    // Usamos BigDecimal para lidar com dinheiro no Java (é muito mais preciso que double ou float para não perder centavos)
    @Column(nullable = false)
    private BigDecimal amount;

    // Tipo da transação: RECEITA ou DESPESA
    @Column(nullable = false)
    private String type; 

    // Data da transação (LocalDate já cuida do formato Dia/Mês/Ano)
    @Column(nullable = false)
    private LocalDate date;

    // Categoria do gasto (Alimentação, Lazer, etc.)
    @Column(nullable = false)
    private String category;

    // Este é o campo mágico que atrela essa despesa a um usuário específico.
    // Assim, uma pessoa não vê o gasto da outra.
    @Column(nullable = false)
    private Long userId;

    // Construtor vazio (obrigatório para o Spring Boot)
    public Transaction() {}

    // Construtor cheio para facilitar a criação via código
    public Transaction(String description, BigDecimal amount, String type, LocalDate date, String category, Long userId) {
        this.description = description;
        this.amount = amount;
        this.type = type;
        this.date = date;
        this.category = category;
        this.userId = userId;
    }

    // Getters and Setters para permitir leitura e escrita das variáveis de fora dessa classe
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}
