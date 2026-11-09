
package com.recado.controle_membros.infrastructure.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "membros")
public class Membro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Min(value = 1, message = "O ano formativo deve ser 1 ou 2")
    @Max(value = 2, message = "O ano formativo deve ser 1 ou 2")
    @Column(name = "ano")
    private Integer anoFormativo;

    @Column(name = "cidade")
    private String cidade;

    @Column(name = "ministerio")
    private String ministerio;

    @Column(name = "etapa_formativa", nullable = false)
    private String etapa;

    @Column(name = "casa_missao")
    private String casaMissao;

    public Membro() {
    }

    public Membro(
            String nome,
            Integer anoFormativo,
            String cidade,
            String ministerio,
            String etapa,
            String casaMissao
    ) {
        this.nome = nome;
        this.anoFormativo = anoFormativo;
        this.cidade = cidade;
        this.ministerio = ministerio;
        this.etapa = etapa;
        this.casaMissao = casaMissao;
    }

    public Integer getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Integer getAnoFormativo() {
        return anoFormativo;
    }

    public void setAnoFormativo(Integer anoFormativo) {
        this.anoFormativo = anoFormativo;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getMinisterio() {
        return ministerio;
    }

    public void setMinisterio(String ministerio) {
        this.ministerio = ministerio;
    }

    public String getEtapa() {
        return etapa;
    }

    public void setEtapa(String etapa) {
        this.etapa = etapa;
    }

    public String getCasaMissao() {
        return casaMissao;
    }

    public void setCasaMissao(String casaMissao) {
        this.casaMissao = casaMissao;
    }
}
