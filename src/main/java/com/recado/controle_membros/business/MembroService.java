package com.recado.controle_membros.business;

import com.recado.controle_membros.infrastructure.entities.Membro;
import com.recado.controle_membros.infrastructure.repository.MembroRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;

/*
 * CAMADA DE NEGÓCIO (Service)
 *
 * Fica entre o Controller (HTTP) e o Repository (banco). É aqui que moram
 * as REGRAS do sistema. O Controller só repassa; o Repository só grava.
 */
@Service   // registra a classe no Spring para ele poder injetá-la no Controller
public class MembroService {

    // [NOVO] Valor do ano formativo de quem já concluiu todas as etapas.
    private static final int ANO_CONCLUIDO = 0;

    // [NOVO] Pedaço de texto que identifica a etapa "Consagrado/Consagrada".
    // Comparado SEM acento e em minúsculas. Se o nome da etapa no seu banco
    // for outro, é só mudar esta linha.
    private static final String TRECHO_ETAPA_CONSAGRADO = "consagrad";

    private final MembroRepository membroRepository;

    // INJEÇÃO DE DEPENDÊNCIA: o Spring entrega o repositório pronto pelo construtor.
    public MembroService(MembroRepository membroRepository) {
        this.membroRepository = membroRepository;
    }

    // ---------- READ: lista todos ----------
    // Usado pelo GET /membros. Equivale a SELECT * FROM membros.
    public List<Membro> listarTodos() {
        return membroRepository.findAll();
    }

    // ---------- READ: busca um ----------
    // Usado pelo GET /membros/{id} e internamente pelo atualizar().
    // Se não achar, lança RuntimeException -> a API responde HTTP 500 com a
    // mensagem "Membro não encontrado..." (o front-end entende esse texto).
    public Membro buscarPorId(Integer id) {
        return membroRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Membro não encontrado com o ID: " + id
                        )
                );
    }

    // ---------- CREATE ----------
    // Usado pelo POST /membros.
    public Membro cadastrar(Membro membro) {
        // [NOVO] Antes de gravar, aplica a regra: consagrado => ano 0.
        aplicarRegraConsagrado(membro);
        return membroRepository.save(membro);   // id vazio => INSERT
    }

    // ---------- UPDATE ----------
    // Usado pelo PUT /membros/{id}.
    public Membro atualizar(Integer id, Membro dados) {
        // 1) carrega o membro atual do banco (erro se não existir)
        Membro membro = buscarPorId(id);

        // 2) copia campo a campo o que veio do formulário
        membro.setNome(dados.getNome());
        membro.setAnoFormativo(dados.getAnoFormativo());
        membro.setCidade(dados.getCidade());
        membro.setMinisterio(dados.getMinisterio());
        membro.setEtapa(dados.getEtapa());
        membro.setCasaMissao(dados.getCasaMissao());

        // 3) [NOVO] aplica a regra DEPOIS de copiar a etapa, pois é a etapa
        //    que decide se o membro é consagrado
        aplicarRegraConsagrado(membro);

        // 4) id já existe => UPDATE
        return membroRepository.save(membro);
    }

    // ---------- DELETE ----------
    // Usado pelo DELETE /membros/{id}.
    public void excluir(Integer id) {
        if (!membroRepository.existsById(id)) {
            throw new RuntimeException(
                    "Membro não encontrado com o ID: " + id
            );
        }

        membroRepository.deleteById(id);
    }

    // =====================================================================
    // [NOVO] REGRA DO ANO FORMATIVO PARA CONSAGRADOS
    // =====================================================================

    // Se a etapa for "Consagrado", o membro já concluiu todas as etapas:
    // não existe 1º nem 2º ano para ele, então o ano é gravado como 0
    // (o front-end mostra "Concluído"). Isso vale mesmo que alguém envie
    // outro valor direto pela API: o servidor sempre corrige.
    private void aplicarRegraConsagrado(Membro membro) {
        if (ehConsagrado(membro.getEtapa())) {
            membro.setAnoFormativo(ANO_CONCLUIDO);
        }
    }

    // Descobre se o texto da etapa indica consagrado.
    // Exemplos que dão true:  "Consagrado", "consagrada", "CONSAGRADO"
    // Exemplos que dão false: "Noviciado", "Pré-consagração", null
    private boolean ehConsagrado(String etapa) {
        if (etapa == null) {
            return false;
        }

        // NFD separa a letra do acento ("é" vira "e" + "´"); depois o replaceAll
        // remove só os acentos. Assim "Consagrádo" também seria reconhecido.
        String semAcento = Normalizer.normalize(etapa, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();

        return semAcento.contains(TRECHO_ETAPA_CONSAGRADO);
    }
}