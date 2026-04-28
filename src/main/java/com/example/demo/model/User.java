package com.example.demo.model;

import jakarta.persistence.*;

// @Entity diz ao Spring Boot: "Transforme essa classe Java em uma tabela no banco de dados"
@Entity
// @Table serve para dar um nome específico para a tabela. Aqui chamamos de "users" (no plural).
@Table(name = "users")
public class User {

    // @Id avisa que essa variável é a Chave Primária (o identificador único) da tabela
    @Id
    // @GeneratedValue diz pro banco de dados gerar esse número automaticamente (1, 2, 3...)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // @Column define as regras da coluna. nullable = false significa que é obrigatório preencher (NÃO pode ser nulo)
    @Column(nullable = false)
    private String name;

    // unique = true significa que não pode haver dois usuários com o mesmo nome de login no banco
    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    // Construtor vazio (O Spring Boot exige que toda entidade tenha um construtor vazio)
    public User() {}

    // Construtor cheio (Para podermos criar usuários facilmente no código)
    public User(String name, String username, String password) {
        this.name = name;
        this.username = username;
        this.password = password;
    }

    // Getters and Setters (Métodos obrigatórios no Java para acessar e modificar as variáveis que são privadas)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
