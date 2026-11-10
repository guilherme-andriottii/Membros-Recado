package com.recado.controle_membros.infrastructure.entities;

// OBS: a PASTA se chama "entitys", mas o PACOTE declarado é "entities".
// Funciona (o Maven compila do mesmo jeito), porém o ideal é renomear a
// pasta para "entities" para ficar igual ao pacote e o IDE não reclamar.

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/*
 * ENTIDADE = a classe Java que representa UMA LINHA da tabela "membros".
 * O Hibernate (JPA) converte automaticamente:
 *    objeto Membro  <->  linha da tabela "membros" no PostgreSQL
 *
 * Esta mesma classe também é o "molde" do JSON trocado com o front-end:
 *   { "nome": "...", "anoFormativo": 1, "cidade": "...", ... }
 */
@Entity                      // diz ao JPA: "esta classe é uma tabela"
@Table(name = "membros")     // nome real da tabela no banco
public class Membro {

    // ---------- CHAVE PRIMÁRIA ----------
    @Id                                                    // este campo é o identificador
    @GeneratedValue(strategy = GenerationType.IDENTITY)    // o banco gera o número (auto-incremento)
    private Integer id;

    // ---------- NOME (obrigatório) ----------
    @Column(name = "nome", nullable = false)   // coluna "nome", não aceita NULL
    private String nome;

    // ---------- ANO FORMATIVO  <<< ESTE É O CAMPO DA SUA ALTERAÇÃO >>> ----------
    // Valores aceitos:
    //   0 = CONCLUÍDO (membro consagrado: já terminou todas as etapas)
    //   1 = 1º ano formativo
    //   2 = 2º ano formativo
    //
    // [ALTERADO] Antes era @Min(1) e a mensagem dizia "1 ou 2". Com @Min(0)
    // o valor 0 passa a ser válido. A validação roda quando o controller
    // recebe o JSON com @Valid; se falhar, a API responde HTTP 400.
    //
    // OBS: valor null também passa nesta validação (o @Min/@Max ignoram
    // null). Quem exige o preenchimento é o formulário do front-end.
    @Min(value = 0, message = "O ano formativo deve ser 0 (concluído), 1 ou 2")
    @Max(value = 2, message = "O ano formativo deve ser 0 (concluído), 1 ou 2")
    @Column(name = "ano")                      // na tabela a coluna se chama "ano"
    private Integer anoFormativo;

    // ---------- CAMPOS OPCIONAIS ----------
    @Column(name = "cidade")
    private String cidade;

    @Column(name = "ministerio")
    private String ministerio;

    // ---------- ETAPA FORMATIVA (obrigatória) ----------
    // É ela que indica se a pessoa é "Consagrado": o MembroService lê este
    // texto e, se for consagrado, força anoFormativo = 0.
    @Column(name = "etapa_formativa", nullable = false)
    private String etapa;

    @Column(name = "casa_missao")
    private String casaMissao;

    // ---------- CONSTRUTORES ----------
    // Construtor vazio: OBRIGATÓRIO para o JPA e para o Jackson (leitura do JSON).
    public Membro() {
    }

    // Construtor completo: atalho para criar um membro já preenchido no código.
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

    // ---------- GETTERS E SETTERS ----------
    // O Jackson usa os getters para montar o JSON de resposta e os setters
    // para ler o JSON recebido. (Lombok está no pom.xml, mas não é usado aqui:
    // por isso os métodos foram escritos à mão.)
    // Note que NÃO existe setId: o id nunca deve ser alterado por fora.

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