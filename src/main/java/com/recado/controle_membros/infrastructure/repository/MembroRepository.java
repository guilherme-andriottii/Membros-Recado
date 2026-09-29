package com.recado.controle_membros.Infrastructure.repository;

import com.recado.controle_membros.Infrastructure.entitys.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembroRepository extends JpaRepository<Membro, Long> {
}