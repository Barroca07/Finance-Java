package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// @Repository indica que esta interface cuida do acesso aos dados no banco
@Repository
// JpaRepository<Entidade, TipoDoID> já traz todos os comandos prontos (salvar, deletar, buscarPorId)
public interface UserRepository extends JpaRepository<User, Long> {
    
    // O Spring Boot é inteligente: ao ler "findByUsername", ele cria sozinho o código SQL para buscar um usuário pelo nome de login!
    // Usamos Optional porque o usuário pode não existir (evita o temido erro NullPointerException)
    Optional<User> findByUsername(String username);
}
