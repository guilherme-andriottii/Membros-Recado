
package com.recado.controle_membros.infrastructure.repository;

import com.recado.controle_membros.infrastructure.entities.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembroRepository extends JpaRepository<Membro, Integer> {
}
