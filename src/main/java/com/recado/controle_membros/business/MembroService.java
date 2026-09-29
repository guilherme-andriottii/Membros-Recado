package com.recado.controle_membros.business;

import com.recado.controle_membros.Infrastructure.entitys.Membro;
import com.recado.controle_membros.Infrastructure.repository.MembroRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MembroService {

    private final MembroRepository membroRepository;

    public MembroService(MembroRepository membroRepository) {
        this.membroRepository = membroRepository;
    }

    public List<Membro> listarTodos() {
        return membroRepository.findAll();
    }

    public Membro buscarPorId(Long id) {
        return membroRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Membro não encontrado com o ID: " + id)
                );
    }

    public Membro cadastrar(Membro membro) {
        return membroRepository.save(membro);
    }

    public Membro atualizar(Long id, Membro dados) {

        Membro membro = buscarPorId(id);

        membro.setNome(dados.getNome());
        membro.setAno(dados.getAno());
        membro.setCidade(dados.getCidade());
        membro.setMinisterio(dados.getMinisterio());
        membro.setEtapa(dados.getEtapa());
        membro.setCasaMissao(dados.getCasaMissao());

        return membroRepository.save(membro);
    }

    public void excluir(Long id) {

        if (!membroRepository.existsById(id)) {
            throw new RuntimeException(
                    "Membro não encontrado com o ID: " + id
            );
        }

        membroRepository.deleteById(id);
    }
}