package com.recado.controle_membros.Infrastructure.entitys;

import jakarta.persistence.*;

@Entity
@Table(name = "membros")
public class Membro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private Integer ano;

    @Column(nullable = false)
    private String cidade;

    @Column(nullable = false)
    private String ministerio;

    @Column(nullable = false)
    private String etapa;

    @Column(name = "casa_missao", nullable = false)
    private String casaMissao;

    public Membro() {
    }

    public Membro(
            String nome,
            Integer ano,
            String cidade,
            String ministerio,
            String etapa,
            String casaMissao
    ) {
        this.nome = nome;
        this.ano = ano;
        this.cidade = cidade;
        this.ministerio = ministerio;
        this.etapa = etapa;
        this.casaMissao = casaMissao;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public Integer getAno() {
        return ano;
    }

    public void setAno(Integer ano) {
        this.ano = ano;
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