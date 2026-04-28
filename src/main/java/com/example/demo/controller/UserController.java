package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

// @RestController diz que esta classe recebe requisições de fora (do navegador) e devolve os dados puros (em JSON)
@RestController
// @RequestMapping("/api/users") diz que toda função aqui dentro vai começar com o endereço localhost:8080/api/users
@RequestMapping("/api/users")
// @CrossOrigin("*") libera para que o Javascript rodando no seu navegador consiga acessar essa API sem bloqueios do Google Chrome
@CrossOrigin(origins = "*") 
public class UserController {

    // @Autowired diz pro Spring: "Injete o repositório de usuários aqui dentro pra mim"
    @Autowired
    private UserRepository userRepository;

    // @PostMapping indica que essa função roda quando mandarem dados via POST (para salvar algo novo)
    @PostMapping("/register")
    // @RequestBody pega o JSON que veio do Javascript e transforma no objeto 'User' do Java
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        
        // Verifica no banco de dados se esse nome de usuário já existe
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Username already exists"); // Se existe, dá erro 409!
        }
        
        // Se não existir, pede pro repositório salvar e devolve o usuário criado
        User savedUser = userRepository.save(user);
        savedUser.setPassword(null); // Apagamos a senha da resposta pra não vazar informações pro navegador
        
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser); // Devolve status 201 (Criado)
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody User loginRequest) {
        // Tenta achar o usuário pelo username fornecido na tela de login
        Optional<User> userOptional = userRepository.findByUsername(loginRequest.getUsername());
        
        if (userOptional.isPresent()) {
            User user = userOptional.get(); // Pega o usuário do banco
            
            // Compara a senha digitada com a senha do banco (Aviso: Em produção, senhas devem ser criptografadas!)
            if (user.getPassword().equals(loginRequest.getPassword())) {
                user.setPassword(null); // Esconde a senha
                return ResponseEntity.ok(user); // Status 200 OK - Login deu certo!
            }
        }
        
        // Se a senha estiver errada ou usuário não existir, devolve Erro 401 (Não Autorizado)
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }
}
