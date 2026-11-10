package com.recado.controle_membros.controller;

import com.recado.controle_membros.infrastructure.entities.Membro;
import com.recado.controle_membros.business.MembroService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
 * CAMADA WEB (Controller REST) — a "porta de entrada" da API.
 *
 * @RestController: tudo que os métodos devolvem vira JSON automaticamente.
 * @RequestMapping("/membros"): todos os endereços abaixo começam com /membros.
 *
 * Resumo da API (CRUD completo):
 *   GET    /membros        -> lista todos
 *   GET    /membros/{id}   -> busca um
 *   POST   /membros        -> cadastra
 *   PUT    /membros/{id}   -> atualiza
 *   DELETE /membros/{id}   -> exclui
 *
 * O controller NÃO tem regra de negócio: só recebe, valida e chama o Service.
 */
@RestController
@RequestMapping("/membros")
public class MembroController {

    private final MembroService membroService;

    // Injeção de dependência: o Spring entrega o Service pronto.
    public MembroController(MembroService membroService) {
        this.membroService = membroService;
    }

    // GET /membros -> HTTP 200 + lista de membros em JSON
    @GetMapping
    public ResponseEntity<List<Membro>> listarTodos() {
        return ResponseEntity.ok(membroService.listarTodos());
    }

    // GET /membros/5 -> HTTP 200 + o membro de id 5
    // @PathVariable pega o "5" da URL e entrega no parâmetro id.
    @GetMapping("/{id}")
    public ResponseEntity<Membro> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(membroService.buscarPorId(id));
    }

    // POST /membros -> HTTP 201 (Created) + membro salvo (já com id)
    // @RequestBody transforma o JSON recebido num objeto Membro.
    // @Valid roda as validações da entidade (@Min, @Max...). Se falhar, o
    // Spring já responde HTTP 400 e o método nem chega a executar.
    @PostMapping
    public ResponseEntity<Membro> cadastrar(
            @Valid @RequestBody Membro membro
    ) {
        Membro novoMembro = membroService.cadastrar(membro);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(novoMembro);
    }

    // PUT /membros/5 -> HTTP 200 + membro atualizado
    @PutMapping("/{id}")
    public ResponseEntity<Membro> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Membro membro
    ) {
        return ResponseEntity.ok(
                membroService.atualizar(id, membro)
        );
    }

    // DELETE /membros/5 -> HTTP 204 (No Content): deu certo e não há corpo
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        membroService.excluir(id);

        return ResponseEntity.noContent().build();
    }
}