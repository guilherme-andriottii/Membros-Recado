
package com.recado.controle_membros.controller;

import com.recado.controle_membros.infrastructure.entities.Membro;
import com.recado.controle_membros.business.MembroService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/membros")
public class MembroController {

    private final MembroService membroService;

    public MembroController(MembroService membroService) {
        this.membroService = membroService;
    }

    @GetMapping
    public ResponseEntity<List<Membro>> listarTodos() {
        return ResponseEntity.ok(membroService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Membro> buscarPorId(@PathVariable Integer id) {
        return ResponseEntity.ok(membroService.buscarPorId(id));
    }

    @PostMapping
    public ResponseEntity<Membro> cadastrar(
            @Valid @RequestBody Membro membro
    ) {
        Membro novoMembro = membroService.cadastrar(membro);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(novoMembro);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Membro> atualizar(
            @PathVariable Integer id,
            @Valid @RequestBody Membro membro
    ) {
        return ResponseEntity.ok(
                membroService.atualizar(id, membro)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Integer id) {
        membroService.excluir(id);

        return ResponseEntity.noContent().build();
    }
}
