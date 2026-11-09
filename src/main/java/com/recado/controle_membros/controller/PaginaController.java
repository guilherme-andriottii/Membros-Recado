
package com.recado.controle_membros.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PaginaController {

    @GetMapping("/")
    public String inicio() {
        return "redirect:/index.html";
    }
}
