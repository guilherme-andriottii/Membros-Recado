package com.recado.controle_membros.infrastructure.repository;

import com.recado.controle_membros.infrastructure.entities.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/*
 * CAMADA DE ACESSO AO BANCO (Repository)
 *
 * É só uma interface VAZIA: o Spring Data JPA cria a implementação sozinho
 * em tempo de execução. Ao estender JpaRepository<Membro, Integer> já
 * ganhamos, sem escrever SQL:
 *
 *   findAll()        -> SELECT * FROM membros
 *   findById(id)     -> SELECT ... WHERE id = ?   (devolve Optional)
 *   save(membro)     -> INSERT (id novo) ou UPDATE (id existente)
 *   existsById(id)   -> confere se o id existe
 *   deleteById(id)   -> DELETE ... WHERE id = ?
 *
 * Os dois tipos entre <> significam:
 *   Membro  = a entidade (tabela) que este repositório gerencia
 *   Integer = o tipo da chave primária (campo "id")
 */
@Repository
public interface MembroRepository extends JpaRepository<Membro, Integer> {
}