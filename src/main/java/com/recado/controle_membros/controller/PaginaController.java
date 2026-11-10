package com.recado.controle_membros.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/*
 * Controller de PÁGINA (devolve telas, não JSON).
 *
 * Diferença importante:
 *   @Controller      -> o retorno String é o nome de uma página/redirecionamento
 *   @RestController  -> o retorno vira JSON (usado no MembroController)
 */
@Controller
public class PaginaController {

    // Quando alguém abre http://localhost:8080/ , o navegador é redirecionado
    // para /index.html (arquivo que está em resources/static).
    @GetMapping("/")
    public String inicio() {
        return "redirect:/index.html";
    }
}