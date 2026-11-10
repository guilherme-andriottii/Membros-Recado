/* =========================================================================
   Controle de Membros — Comunidade Recado
   Frontend em JavaScript puro (Vanilla JS) que consome a API REST Spring Boot.

   Mapa do arquivo:
     1. Configuração e estado
     2. Camada de API  (único lugar que usa fetch)
     3. Utilitários    (criar elementos, textos, ícones, avisos)
     4. Renderização   (dashboard, tabela, sugestões)
     5. Formulário     (cadastro / edição, validação)
     6. Detalhes e exclusão
     7. Navegação (rotas por hash) e eventos
     8. Inicialização
   ========================================================================= */
// MODO ESTRITO: o JavaScript passa a acusar erros que normalmente ignoraria
// (ex.: usar uma variável sem declará-la). Evita bugs silenciosos.
//
// BASE DESTE ARQUIVO: JavaScript puro (Vanilla JS), sem frameworks.
// Fluxo geral do app:
//    [estado]  ->  [renderização na tela]  ->  [ação do usuário (evento)]
//         ^                                              |
//         |                                              v
//         +----------- atualiza ------------  [chamada à API (fetch)]
//
// REGRA DO ANO FORMATIVO (alteração pedida):
//    0 = Concluído  (membro consagrado, já concluiu todas as etapas)
//    1 = 1º ano     |  2 = 2º ano
// Consagrado não responde o ano: o formulário trava o campo em "Concluído" e a
// aba Membros exibe "Concluído". Procure por [NOVO] e [ALTERADO] neste arquivo
// para ver cada trecho que mudou.
"use strict";


/* =========================================================================
   1. CONFIGURAÇÃO E ESTADO
   ========================================================================= */

// Front e back rodam na mesma origem (http://localhost:8080), então usamos
// caminho relativo. Equivale a http://localhost:8080/membros.
const API_URL = "/membros";
const TEMPO_LIMITE_MS = 10000;   // desiste da requisição após 10 s
const LIMITE_CAMPO = 255;        // tamanho padrão de VARCHAR no banco

// "Fonte da verdade" da tela: tudo que aparece é desenhado a partir daqui.
const estado = {
    membros: [],                 // dados reais recebidos do GET /membros
    carregando: false,
    carregadoUmaVez: false,
    erro: null,                  // ApiError da última listagem (ou null)
    busca: "",
    filtroAno: "todos",          // "todos" | "0" | "1" | "2"   ([ALTERADO] 0 = concluído)
    ordem: { campo: "nome", direcao: "asc" },
    editandoId: null,            // null = cadastro (POST) | número = edição (PUT)
    salvando: false
};

// Atalho: $("nome") equivale a document.getElementById("nome").
const $ = id => document.getElementById(id);

// DOM EM CACHE: guarda as referências aos elementos da página (buscados UMA vez), para não repetir getElementById o tempo todo. As chaves seguem os ids do index.html.
const dom = {
    navContador: $("nav-contador"),
    apiStatus: $("api-status"),
    apiStatusTexto: $("api-status-texto"),
    titulo: $("page-title"),
    subtitulo: $("page-subtitle"),
    btnAtualizar: $("btn-atualizar"),

    dashErro: $("dashboard-erro"),
    dashErroTexto: $("dashboard-erro-texto"),
    statTotal: $("stat-total"),
    statPrimeiro: $("stat-primeiro"),
    statSegundo: $("stat-segundo"),
    statPrimeiroPct: $("stat-primeiro-pct"),
    statSegundoPct: $("stat-segundo-pct"),
    barraPrimeiro: $("barra-primeiro"),
    barraSegundo: $("barra-segundo"),
    listaMinisterios: $("lista-ministerios"),
    listaRecentes: $("lista-recentes"),

    membrosErro: $("membros-erro"),
    pesquisa: $("pesquisa"),
    limparPesquisa: $("limpar-pesquisa"),
    filtrosAno: $("filtros-ano"),
    contador: $("contador-resultados"),
    tabela: $("tabela-membros"),
    corpoTabela: $("lista-membros"),

    dlgForm: $("modal-membro"),
    form: $("form-membro"),
    tituloModal: $("titulo-modal"),
    subtituloModal: $("subtitulo-modal"),
    chipHttp: $("chip-http"),
    erroForm: $("erro-formulario"),
    btnSalvar: $("salvar-membro"),
    salvarTexto: $("salvar-texto"),

    dlgDetalhes: $("modal-detalhes"),
    detAvatar: $("det-avatar"),
    detNome: $("det-nome"),
    detId: $("det-id"),
    detCampos: $("det-campos"),

    dlgConfirmar: $("modal-confirmar"),
    confirmarMensagem: $("confirmar-mensagem"),

    toasts: $("toasts")
};

// Campos do formulário: o "name" é EXATAMENTE a propriedade JSON do backend.
const CAMPOS = ["nome", "anoFormativo", "cidade", "ministerio", "etapa", "casaMissao"];
const ROTULOS = {
    nome: "Nome completo",
    anoFormativo: "Ano formativo",
    cidade: "Cidade",
    ministerio: "Ministério",
    etapa: "Etapa formativa",
    casaMissao: "Casa de missão"
};

// [NOVO] ---------------- REGRA DO ANO FORMATIVO ----------------
// Quem é consagrado já concluiu todas as etapas: não existe 1º nem 2º ano
// para ele. Por isso o ano é 0, e a tela mostra "Concluído".
// O mesmo valor 0 é aceito (e também forçado) pelo back-end (MembroService).
const ANO_CONCLUIDO = 0;

// [NOVO] Trecho que identifica a etapa "Consagrado/Consagrada". É comparado
// SEM acento e em minúsculas. Se no seu banco a etapa tiver outro nome,
// altere somente esta linha (e a constante igual no MembroService.java).
const TRECHO_ETAPA_CONSAGRADO = "consagrad";


/* =========================================================================
   2. CAMADA DE API — toda a comunicação HTTP com o backend Java
   ========================================================================= */

// Erro com o status HTTP (0 = falha de rede) e detalhes vindos do servidor.
class ApiError extends Error {
    constructor(mensagem, status = 0, detalhes = null) {
        super(mensagem);
        this.name = "ApiError";
        this.status = status;
        this.detalhes = detalhes;
    }
}

// Função central: envia a requisição, valida a resposta e devolve o JSON.
async function requisitar(caminho = "", opcoes = {}) {
    // AbortController + setTimeout = "timeout" manual: se o servidor não responder em 10 s, a requisição é cancelada (cai no catch como AbortError).
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

    // Cabeçalhos HTTP: Accept = queremos JSON na resposta; o Content-Type só é enviado quando há corpo (POST/PUT).
    const cabecalhos = { Accept: "application/json" };
    if (opcoes.body !== undefined) {
        cabecalhos["Content-Type"] = "application/json";   // corpo é JSON
    }

    let resposta;
    try {
        // fetch() dispara a requisição HTTP. O "await" pausa só ESTA função até a resposta chegar, sem travar a página.
        resposta = await fetch(`${API_URL}${caminho}`, {
            ...opcoes,
            headers: cabecalhos,
            signal: controlador.signal
        });
    } catch (falha) {
        // fetch só rejeita quando NÃO houve resposta (servidor fora, rede, timeout)
        const mensagem = falha.name === "AbortError"
            ? "O servidor demorou demais para responder. Tente novamente."
            : "Não foi possível conectar ao servidor. Verifique se o backend está em execução (http://localhost:8080).";
        throw new ApiError(mensagem, 0);
    } finally {
        clearTimeout(temporizador);
    }

    // resposta.ok é falso para status 4xx/5xx. Nesse caso viramos um ApiError com mensagem amigável.
    if (!resposta.ok) {
        throw await criarErroHttp(resposta);
    }

    // 204 No Content (DELETE) não possui corpo
    if (resposta.status === 204) {
        return null;
    }
    // Converte o corpo da resposta (texto JSON) em objeto/array JavaScript.
    return resposta.json();
}

// Converte uma resposta HTTP de erro (4xx/5xx) em uma mensagem amigável.
async function criarErroHttp(resposta) {
    let detalhes = null;
    try {
        detalhes = await resposta.json();   // corpo padrão de erro do Spring Boot
    } catch {
        /* resposta sem JSON: segue com a mensagem padrão */
    }

    const doServidor = detalhes && typeof detalhes.message === "string" ? detalhes.message : "";
    let mensagem;

    if (resposta.status === 400) {
        mensagem = "Dados inválidos. Revise os campos e tente novamente.";
    } else if (resposta.status === 404) {
        mensagem = "Membro não encontrado. Ele pode já ter sido excluído.";
    } else if (resposta.status >= 500) {
        // O backend lança RuntimeException quando o ID não existe, o que vira HTTP 500.
        mensagem = doServidor.includes("não encontrado")
            ? doServidor
            : "O servidor encontrou um erro ao processar a solicitação (HTTP " + resposta.status + "). O membro pode não existir mais ou o banco pode estar indisponível.";
    } else {
        mensagem = `Erro inesperado (HTTP ${resposta.status}).`;
    }
    return new ApiError(mensagem, resposta.status, detalhes);
}

// Um método por endpoint do MembroController.
const api = {
    // GET /membros
    async listar() {
        const dados = await requisitar();
        if (!Array.isArray(dados)) {
            throw new ApiError("Resposta inesperada do servidor ao listar membros.", 200);
        }
        return dados;
    },
    // GET /membros/{id}
    buscarPorId(id) {
        return requisitar(`/${encodeURIComponent(id)}`);
    },
    // POST /membros
    cadastrar(membro) {
        return requisitar("", { method: "POST", body: JSON.stringify(membro) });
    },
    // PUT /membros/{id}
    atualizar(id, membro) {
        return requisitar(`/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(membro) });
    },
    // DELETE /membros/{id}
    excluir(id) {
        return requisitar(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    }
};


/* =========================================================================
   3. UTILITÁRIOS
   ========================================================================= */

/* Cria elementos DOM de forma segura. Textos entram como nós de texto
   (nunca como HTML), o que protege contra injeção de HTML/XSS vinda do banco. */
function el(tag, atributos = {}, ...filhos) {
    const no = document.createElement(tag);
    for (const [chave, valor] of Object.entries(atributos)) {
        if (valor === null || valor === undefined || valor === false) continue;
        if (chave === "class") no.className = valor;
        else if (chave === "text") no.textContent = valor;
        else no.setAttribute(chave, valor === true ? "" : valor);
    }
    for (const filho of filhos.flat()) {
        if (filho === null || filho === undefined || filho === false) continue;
        no.append(filho);   // string vira texto puro; Node é anexado normalmente
    }
    return no;
}

// Ícones SVG fixos (conteúdo estático do próprio código, nunca dados do usuário).
const ICONES = {
    editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    excluir: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    ver: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    vazio: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13l3.5 7v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/>',
    alerta: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    ok: '<path d="M20 6 9 17l-5-5"/>',
    fechar: '<path d="M18 6 6 18M6 6l12 12"/>'
};

// Monta um <svg> a partir do nome em ICONES. createElementNS é necessário porque SVG usa outro "namespace" XML.
function icone(nome) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONES[nome];
    return svg;
}

// Remove acentos e caixa para pesquisar "lencois" e achar "Lençóis".
function normalizar(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .trim();
}

// Garante texto: converte null/undefined em "" e remove espaços das pontas (trim).
function textoLimpo(valor) {
    return String(valor ?? "").trim();
}

// Gera as iniciais do avatar: "Maria da Silva" -> "MS" (1ª letra do primeiro e do último nome).
function iniciais(nome) {
    const partes = textoLimpo(nome).split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    const primeira = partes[0][0];
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
    return (primeira + ultima).toUpperCase();
}

// Cria o círculo com as iniciais (pequeno na tabela, grande no modal de detalhes).
function avatar(nome, grande = false) {
    return el("span", { class: grande ? "avatar avatar-grande" : "avatar", "aria-hidden": "true", text: iniciais(nome) });
}

// Mostra "—" quando o campo opcional está vazio.
function textoOuTraco(valor) {
    const texto = textoLimpo(valor);
    return texto ? el("span", { text: texto }) : el("span", { class: "vazio", text: "—" });
}

// [NOVO] true se a etapa indica "Consagrado/Consagrada".
// Ex.: "Consagrado" -> true | "Noviciado" -> false | vazio -> false
function ehConsagrado(etapa) {
    return normalizar(etapa).includes(TRECHO_ETAPA_CONSAGRADO);
}

// [NOVO] Ano que deve ser EXIBIDO e CONTADO para o membro.
// Se a etapa é "Consagrado", vale 0 (Concluído) mesmo que o banco ainda
// guarde 1, 2 ou vazio (cadastros antigos). Assim a tela já fica correta
// sem precisar corrigir os dados antigos. Caso contrário, usa o valor salvo.
function anoEfetivo(membro) {
    return ehConsagrado(membro.etapa) ? ANO_CONCLUIDO : membro.anoFormativo;
}

// [NOVO] Texto do ano para exibir e pesquisar: 0 -> "Concluído",
// 1 -> "1º ano", 2 -> "2º ano". Qualquer outro valor -> "" (sem texto).
function rotuloAno(ano) {
    if (ano === ANO_CONCLUIDO) return "Concluído";
    if (ano === 1 || ano === 2) return `${ano}º ano`;
    return "";
}

// [ALTERADO] Chip (etiqueta) do ano. A classe CSS acompanha o número:
// chip-ano-0 (verde, Concluído), chip-ano-1 (azul) e chip-ano-2 (dourado).
// Antes só existiam 1 e 2; para o ano 0 aparecia "—".
function chipAno(ano) {
    const rotulo = rotuloAno(ano);
    return rotulo
        ? el("span", { class: `chip chip-ano-${ano}`, text: rotulo })
        : el("span", { class: "vazio", text: "—" });
}

// Percentual inteiro; evita divisão por zero (total 0 -> 0%).
function porcentagem(parte, total) {
    return total > 0 ? Math.round((parte / total) * 100) : 0;
}

// Notificação não-bloqueante (substitui o alert()).
function avisar(mensagem, tipo = "sucesso") {
    const toast = el("div", { class: `toast toast-${tipo}`, role: tipo === "erro" ? "alert" : "status" },
        icone(tipo === "erro" ? "alerta" : "ok"),
        el("p", { text: mensagem })
    );
    const remover = () => toast.remove();
    const botaoFechar = el("button", { type: "button", "aria-label": "Fechar aviso" }, icone("fechar"));
    botaoFechar.addEventListener("click", remover);
    toast.append(botaoFechar);

    dom.toasts.append(toast);
    setTimeout(remover, tipo === "erro" ? 7000 : 4000);
}

// Preenche uma caixa de alerta vermelha com ícone + texto e a torna visível.
function mostrarAlerta(elemento, mensagem) {
    elemento.replaceChildren(icone("alerta"), el("p", { text: mensagem }));
    elemento.hidden = false;
}


/* =========================================================================
   4. RENDERIZAÇÃO
   ========================================================================= */

// Busca os membros no backend e redesenha a tela.
async function carregarMembros({ silencioso = false } = {}) {
    estado.carregando = true;
    estado.erro = null;
    dom.btnAtualizar.disabled = true;
    definirStatusApi("carregando", "Conectando ao servidor…");
    if (!silencioso) renderizarTabela();      // mostra o esqueleto de carregamento

    try {
        estado.membros = await api.listar();
        estado.carregadoUmaVez = true;
        definirStatusApi("online", "API conectada");
    } catch (erro) {
        estado.erro = erro;
        definirStatusApi("offline", erro.status === 0 ? "Servidor indisponível" : "Erro na API");
        console.error("Falha ao listar membros:", erro);
    } finally {
        estado.carregando = false;
        dom.btnAtualizar.disabled = false;
        renderizarTudo();
    }
}

// Redesenha todas as áreas da tela a partir de estado.membros. É chamada depois de cada carregamento.
function renderizarTudo() {
    renderizarDashboard();
    renderizarTabela();
    renderizarSugestoes();
    dom.navContador.textContent = estado.carregadoUmaVez ? estado.membros.length : "0";
}

// Atualiza a bolinha e o texto do rodapé do menu: "carregando" (amarelo), "online" (verde) ou "offline" (vermelho). A classe CSS é que muda a cor.
function definirStatusApi(situacao, texto) {
    dom.apiStatus.className = `api-status ${situacao}`;
    dom.apiStatusTexto.textContent = texto;
}

/* ---------- Dashboard: tudo calculado com os dados reais do backend ---------- */

function renderizarDashboard() {
    const { membros, carregadoUmaVez, erro } = estado;

    if (erro) {
        mostrarAlerta(dom.dashErro, erro.message);
        dom.dashErro.append(botaoTentarNovamente());
    } else {
        dom.dashErro.hidden = true;
    }

    if (!carregadoUmaVez) {
        // ainda sem dados: não mostra números inventados
        dom.statTotal.textContent = "—";
        dom.statPrimeiro.textContent = "—";
        dom.statSegundo.textContent = "—";
        dom.statPrimeiroPct.textContent = " ";
        dom.statSegundoPct.textContent = " ";
        dom.barraPrimeiro.style.width = "0%";
        dom.barraSegundo.style.width = "0%";
        dom.listaMinisterios.replaceChildren(el("li", { class: "painel-vazio", text: "Aguardando dados do servidor…" }));
        dom.listaRecentes.replaceChildren(el("li", { class: "painel-vazio", text: "Aguardando dados do servidor…" }));
        return;
    }

    const total = membros.length;
    // [ALTERADO] usa anoEfetivo(): consagrados (ano 0 = Concluído) NÃO são
    // contados como 1º nem 2º ano; entram só no total de membros.
    const primeiro = membros.filter(m => anoEfetivo(m) === 1).length;
    const segundo = membros.filter(m => anoEfetivo(m) === 2).length;

    dom.statTotal.textContent = total;
    dom.statPrimeiro.textContent = primeiro;
    dom.statSegundo.textContent = segundo;
    dom.statPrimeiroPct.textContent = `${porcentagem(primeiro, total)}% dos membros`;
    dom.statSegundoPct.textContent = `${porcentagem(segundo, total)}% dos membros`;
    dom.barraPrimeiro.style.width = `${porcentagem(primeiro, total)}%`;
    dom.barraSegundo.style.width = `${porcentagem(segundo, total)}%`;

    renderizarMinisterios();
    renderizarRecentes();
}

// Cria o botão "Tentar novamente", que refaz o GET /membros.
function botaoTentarNovamente() {
    const botao = el("button", { type: "button", class: "btn btn-small" }, "Tentar novamente");
    botao.addEventListener("click", () => carregarMembros());
    return botao;
}

// Agrupa por ministério (ignora vazios) e mostra os 6 maiores.
function renderizarMinisterios() {
    const grupos = new Map();
    for (const membro of estado.membros) {
        const nome = textoLimpo(membro.ministerio);
        if (!nome) continue;
        const chave = normalizar(nome);
        const grupo = grupos.get(chave) ?? { nome, quantidade: 0 };
        grupo.quantidade++;
        grupos.set(chave, grupo);
    }

    const ordenados = [...grupos.values()]
        .sort((a, b) => b.quantidade - a.quantidade || a.nome.localeCompare(b.nome, "pt-BR"))
        .slice(0, 6);

    if (ordenados.length === 0) {
        dom.listaMinisterios.replaceChildren(el("li", { class: "painel-vazio", text: "Nenhum ministério informado ainda." }));
        return;
    }

    const maior = ordenados[0].quantidade;
    dom.listaMinisterios.replaceChildren(...ordenados.map(grupo =>
        el("li", {},
            el("span", { class: "barras-nome", text: grupo.nome }),
            el("span", { class: "barras-trilho" },
                el("span", { class: "barras-preenchimento", style: `width:${porcentagem(grupo.quantidade, maior)}%` })),
            el("span", { class: "barras-valor", text: grupo.quantidade })
        )
    ));
}

// Últimos 5 cadastros (maior ID = mais recente).
function renderizarRecentes() {
    const recentes = [...estado.membros]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    if (recentes.length === 0) {
        dom.listaRecentes.replaceChildren(el("li", { class: "painel-vazio", text: "Nenhum membro cadastrado ainda." }));
        return;
    }

    dom.listaRecentes.replaceChildren(...recentes.map(membro => {
        const detalhe = [textoLimpo(membro.ministerio), textoLimpo(membro.cidade)].filter(Boolean).join(" · ") || "Sem detalhes";
        const botao = el("button", { type: "button", "data-acao": "ver", "data-id": membro.id },
            avatar(membro.nome),
            el("span", { class: "recente-texto" },
                el("strong", { text: membro.nome }),
                el("small", { text: detalhe })),
            chipAno(anoEfetivo(membro))   // [ALTERADO] mostra "Concluído" para consagrado
        );
        return el("li", {}, botao);
    }));
}

/* ---------- Tabela ---------- */

// [NOVO] Valor usado para ORDENAR cada coluna. Na coluna "anoFormativo"
// usa o ano efetivo (Concluído = 0 fica antes do 1º e do 2º ano);
// nas demais colunas usa o valor do próprio campo.
function valorParaOrdenar(membro, campo) {
    return campo === "anoFormativo" ? anoEfetivo(membro) : membro[campo];
}

// Aplica pesquisa + filtro de ano + ordenação sobre os dados reais.
function obterMembrosVisiveis() {
    const termo = normalizar(estado.busca);

    const filtrados = estado.membros.filter(membro => {
        if (estado.filtroAno !== "todos" && String(anoEfetivo(membro)) !== estado.filtroAno) {
            return false;
        }
        if (!termo) return true;
        return [membro.nome, membro.cidade, membro.ministerio, membro.etapa, membro.casaMissao,
            rotuloAno(anoEfetivo(membro))]   // [ALTERADO] pesquisar "concluido" encontra os consagrados
            .some(valor => normalizar(valor).includes(termo));
    });

    const { campo, direcao } = estado.ordem;
    const sinal = direcao === "asc" ? 1 : -1;

    return filtrados.sort((a, b) => {
        const va = valorParaOrdenar(a, campo);   // [ALTERADO]
        const vb = valorParaOrdenar(b, campo);   // [ALTERADO]
        const vazioA = va === null || va === undefined || va === "";
        const vazioB = vb === null || vb === undefined || vb === "";
        if (vazioA && vazioB) return 0;
        if (vazioA) return 1;                 // vazios sempre no fim
        if (vazioB) return -1;
        if (typeof va === "number" && typeof vb === "number") return (va - vb) * sinal;
        return String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base" }) * sinal;
    });
}

// Decide o que mostrar na tabela em 4 situações: carregando (esqueleto), erro sem dados, lista vazia / sem resultado, ou a lista de membros já filtrada e ordenada.
function renderizarTabela() {
    // Estado 1: carregando pela primeira vez -> esqueleto
    if (estado.carregando && !estado.carregadoUmaVez) {
        dom.contador.textContent = "Carregando membros…";
        dom.corpoTabela.replaceChildren(...Array.from({ length: 6 }, linhaEsqueleto));
        return;
    }

    // Estado 2: erro e nenhum dado disponível
    if (estado.erro && !estado.carregadoUmaVez) {
        dom.membrosErro.hidden = true;
        dom.contador.textContent = "";
        dom.corpoTabela.replaceChildren(linhaEstado(
            "alerta", "Não foi possível carregar os membros", estado.erro.message,
            "Tentar novamente", () => carregarMembros()
        ));
        return;
    }

    // Erro ao atualizar, mas ainda existem dados antigos na tela
    if (estado.erro) {
        mostrarAlerta(dom.membrosErro, estado.erro.message + " Os dados exibidos podem estar desatualizados.");
    } else {
        dom.membrosErro.hidden = true;
    }

    const visiveis = obterMembrosVisiveis();
    const total = estado.membros.length;
    const filtrando = estado.busca.trim() !== "" || estado.filtroAno !== "todos";

    dom.contador.textContent = total === 0
        ? ""
        : `Exibindo ${visiveis.length} de ${total} ${total === 1 ? "membro" : "membros"}`;

    // Estado 3: lista vazia
    if (visiveis.length === 0) {
        dom.corpoTabela.replaceChildren(filtrando
            ? linhaEstado("vazio", "Nenhum membro encontrado", "Nenhum resultado para a pesquisa ou o filtro atual.",
                "Limpar filtros", limparFiltros)
            : linhaEstado("vazio", "Nenhum membro cadastrado", "Cadastre o primeiro membro da comunidade.",
                "Cadastrar membro", () => abrirCadastro()));
        return;
    }

    dom.corpoTabela.replaceChildren(...visiveis.map(criarLinha));
}

// Monta UMA linha <tr> da tabela para um membro. A coluna "Ano" mostra o chip (1º ano / 2º ano / Concluído).
function criarLinha(membro) {
    const nome = textoLimpo(membro.nome) || "(sem nome)";
    const botao = (acao, classe, rotulo) => el("button", {
        type: "button",
        class: `btn-icone ${classe}`,
        "data-acao": acao,
        "data-id": membro.id,
        "aria-label": `${rotulo} ${nome}`,
        title: rotulo
    }, icone(acao === "ver" ? "ver" : acao));

    return el("tr", {},
        celula("Nome", el("div", { class: "membro-nome" },
            avatar(nome),
            el("div", {}, el("strong", { text: nome }), el("small", { text: `ID ${membro.id}` })))),
        celula("Ano", chipAno(anoEfetivo(membro))),   // [ALTERADO] coluna Ano: 1º ano / 2º ano / Concluído
        celula("Cidade", textoOuTraco(membro.cidade)),
        celula("Ministério", textoOuTraco(membro.ministerio)),
        celula("Etapa", textoOuTraco(membro.etapa)),
        celula("Casa de missão", textoOuTraco(membro.casaMissao)),
        celula("Ações", el("div", { class: "acoes" },
            botao("ver", "", "Ver detalhes de"),
            botao("editar", "", "Editar"),
            botao("excluir", "perigo", "Excluir")), "col-acoes")
    );
}

// <td> com data-label (usado no layout de cartões do celular)
function celula(rotulo, conteudo, classe = "") {
    return el("td", { "data-label": rotulo, class: classe }, conteudo);
}

// Linha "fantasma" cinza animada, exibida enquanto os dados carregam.
function linhaEsqueleto() {
    return el("tr", { class: "esqueleto", "aria-hidden": "true" },
        ...Array.from({ length: 7 }, () => el("td", {}, el("span", { class: "esqueleto-barra" }))));
}

// Linha única usada para mensagens: lista vazia, nada encontrado ou erro ao carregar (com botão de ação).
function linhaEstado(nomeIcone, titulo, texto, rotuloBotao, aoClicar) {
    const botao = el("button", { type: "button", class: "btn btn-small" }, rotuloBotao);
    botao.addEventListener("click", aoClicar);
    return el("tr", { class: "linha-estado" },
        el("td", { colspan: 7 },
            el("div", { class: "estado-vazio" },
                icone(nomeIcone),
                el("strong", { text: titulo }),
                el("p", { text: texto }),
                botao)));
}

// Atualiza as setas de ordenação (aria-sort) do cabeçalho.
function renderizarCabecalhoOrdenacao() {
    dom.tabela.querySelectorAll("th[data-campo]").forEach(th => {
        const ativo = th.dataset.campo === estado.ordem.campo;
        th.setAttribute("aria-sort", ativo ? (estado.ordem.direcao === "asc" ? "ascending" : "descending") : "none");
    });
}

// Preenche as listas de sugestões do formulário com valores já cadastrados.
function renderizarSugestoes() {
    for (const campo of ["cidade", "ministerio", "etapa", "casaMissao"]) {
        const unicos = new Map();
        for (const membro of estado.membros) {
            const valor = textoLimpo(membro[campo]);
            if (valor && !unicos.has(normalizar(valor))) unicos.set(normalizar(valor), valor);
        }
        const opcoes = [...unicos.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
        $(`sugestoes-${campo}`).replaceChildren(...opcoes.map(valor => el("option", { value: valor })));
    }
}

// Zera a pesquisa e o filtro de ano e redesenha a tabela.
function limparFiltros() {
    estado.busca = "";
    estado.filtroAno = "todos";
    dom.pesquisa.value = "";
    atualizarFiltrosVisuais();
    renderizarTabela();
}

// Sincroniza a aparência: mostra/oculta o X da pesquisa e destaca o botão de ano ativo (aria-pressed). Funciona também para o botão "Concluído" (data-ano="0").
function atualizarFiltrosVisuais() {
    dom.limparPesquisa.hidden = estado.busca === "";
    dom.filtrosAno.querySelectorAll("button").forEach(botao => {
        botao.setAttribute("aria-pressed", String(botao.dataset.ano === estado.filtroAno));
    });
}


/* =========================================================================
   5. FORMULÁRIO — cadastro (POST) e edição (PUT) no mesmo modal
   ========================================================================= */

// Abre o modal vazio para CADASTRAR (estado.editandoId = null -> ao salvar será POST).
function abrirCadastro() {
    estado.editandoId = null;
    dom.form.reset();
    limparErros();

    dom.chipHttp.textContent = "POST";
    dom.chipHttp.className = "chip-http chip-post";
    dom.tituloModal.textContent = "Novo membro";
    dom.subtituloModal.textContent = "Cadastro de um novo membro (POST /membros).";
    dom.salvarTexto.textContent = "Cadastrar membro";
    sincronizarAnoComEtapa();   // [NOVO] garante o campo Ano destravado/limpo num cadastro novo

    dom.dlgForm.showModal();
    $("nome").focus();
}

// Edição: primeiro consulta o membro no servidor (GET /membros/{id}) para
// garantir que o formulário abre com os dados mais atuais do banco.
async function abrirEdicao(id) {
    document.body.classList.add("aguardando");
    try {
        const membro = await api.buscarPorId(id);

        estado.editandoId = membro.id;
        dom.form.reset();
        limparErros();

        for (const campo of CAMPOS) {
            $(campo).value = membro[campo] ?? "";   // "??" mantém o 0 (não vira vazio)
        }
        sincronizarAnoComEtapa();   // [NOVO] se a etapa é "Consagrado", trava o ano em 0

        dom.chipHttp.textContent = "PUT";
        dom.chipHttp.className = "chip-http chip-put";
        dom.tituloModal.textContent = "Editar membro";
        dom.subtituloModal.textContent = `Atualização do membro #${membro.id} (PUT /membros/${membro.id}).`;
        dom.salvarTexto.textContent = "Salvar alterações";

        dom.dlgForm.showModal();
        $("nome").focus();
    } catch (erro) {
        avisar(erro.message, "erro");
        if (erro.status === 404 || erro.status >= 500) carregarMembros({ silencioso: true });
    } finally {
        document.body.classList.remove("aguardando");
    }
}

// Lê o formulário e monta o JSON com os nomes exatos das propriedades do backend.
function lerFormulario() {
    const ano = $("anoFormativo").value;
    return {
        nome: textoLimpo($("nome").value),
        anoFormativo: ano === "" ? null : Number(ano),
        cidade: textoLimpo($("cidade").value),
        ministerio: textoLimpo($("ministerio").value),
        etapa: textoLimpo($("etapa").value),
        casaMissao: textoLimpo($("casaMissao").value)
    };
}

// [NOVO] ---------------------------------------------------------------
// SINCRONIZA O CAMPO "ANO FORMATIVO" COM A "ETAPA".
// É aqui que o consagrado "não pode responder" o ano:
//  - etapa "Consagrado" -> seleciona "Concluído" (0), TRAVA o campo
//    (disabled) e mostra a dica explicando o motivo;
//  - qualquer outra etapa -> campo livre. Se estava travado, volta para
//    "Selecione…" para a pessoa escolher o ano de novo.
// É chamada ao abrir o formulário e a cada vez que a etapa é digitada.
// -----------------------------------------------------------------------
function sincronizarAnoComEtapa() {
    const campoAno = $("anoFormativo");
    const consagrado = ehConsagrado($("etapa").value);

    if (consagrado) {
        campoAno.value = String(ANO_CONCLUIDO);
        campoAno.disabled = true;
        $("erro-anoFormativo").textContent = "";          // apaga erro antigo do campo
        campoAno.removeAttribute("aria-invalid");
    } else {
        if (campoAno.disabled) campoAno.value = "";        // estava travado: limpa a escolha
        campoAno.disabled = false;
    }

    $("dica-anoFormativo").hidden = !consagrado;           // mostra/oculta a dica verde
}

// [ALTERADO] Regras espelhando o backend: nome e etapa são obrigatórios (nullable=false);
// ano formativo deve ser 0 (concluído), 1 ou 2 (@Min(0) @Max(2)).
function validar(dados) {
    const erros = {};
    if (!dados.nome) erros.nome = "Informe o nome do membro.";
    // [ALTERADO] 0 (Concluído) agora é válido. Antes só 1 e 2 passavam.
    if (![ANO_CONCLUIDO, 1, 2].includes(dados.anoFormativo)) erros.anoFormativo = "Selecione o ano formativo (1º ano, 2º ano ou Concluído).";
    if (!dados.etapa) erros.etapa = "Informe a etapa formativa.";

    for (const campo of ["nome", "cidade", "ministerio", "etapa", "casaMissao"]) {
        if (dados[campo].length > LIMITE_CAMPO) {
            erros[campo] = `Use no máximo ${LIMITE_CAMPO} caracteres.`;
        }
    }
    return erros;
}

// Escreve a mensagem abaixo do campo e o marca como inválido (borda vermelha via aria-invalid).
function mostrarErroCampo(campo, mensagem) {
    $(`erro-${campo}`).textContent = mensagem;
    $(campo).setAttribute("aria-invalid", "true");
}

// Remove todas as mensagens de erro do formulário.
function limparErros() {
    for (const campo of CAMPOS) {
        $(`erro-${campo}`).textContent = "";
        $(campo).removeAttribute("aria-invalid");
    }
    dom.erroForm.hidden = true;
}

// Trava o botão Salvar (evita clique duplo) e mostra a rodinha enquanto a requisição está em andamento.
function definirSalvando(salvando) {
    estado.salvando = salvando;
    dom.btnSalvar.disabled = salvando;
    dom.btnSalvar.classList.toggle("carregando", salvando);
}

// Fluxo do botão Salvar: evita recarregar a página, valida, decide POST (novo) ou PUT (editando), fecha o modal, avisa e recarrega a lista.
async function salvarMembro(evento) {
    evento.preventDefault();
    if (estado.salvando) return;

    limparErros();
    const dados = lerFormulario();
    const erros = validar(dados);
    const camposComErro = Object.keys(erros);

    if (camposComErro.length > 0) {
        camposComErro.forEach(campo => mostrarErroCampo(campo, erros[campo]));
        $(camposComErro[0]).focus();
        return;
    }

    const editando = estado.editandoId !== null;
    definirSalvando(true);

    try {
        if (editando) {
            await api.atualizar(estado.editandoId, dados);      // PUT
        } else {
            await api.cadastrar(dados);                         // POST
        }

        dom.dlgForm.close();
        avisar(editando ? "Membro atualizado com sucesso!" : "Membro cadastrado com sucesso!");
        await carregarMembros({ silencioso: true });            // atualiza tabela e dashboard
    } catch (erro) {
        console.error("Falha ao salvar membro:", erro);
        mostrarAlerta(dom.erroForm, erro.message);

        // Se o servidor devolveu erros por campo (400), mostra junto de cada campo.
        const lista = erro.detalhes && Array.isArray(erro.detalhes.errors) ? erro.detalhes.errors : [];
        for (const item of lista) {
            if (CAMPOS.includes(item.field)) {
                mostrarErroCampo(item.field, item.defaultMessage || "Valor inválido.");
            }
        }
    } finally {
        definirSalvando(false);
    }
}

// Impede fechar o modal enquanto uma gravação está em andamento.
function fecharFormulario() {
    if (!estado.salvando) dom.dlgForm.close();
}


/* =========================================================================
   6. DETALHES (GET /membros/{id}) E EXCLUSÃO (DELETE /membros/{id})
   ========================================================================= */

// Abre o modal de detalhes: faz GET /membros/{id} para exibir os dados mais atuais do banco.
async function abrirDetalhes(id) {
    document.body.classList.add("aguardando");
    try {
        const membro = await api.buscarPorId(id);

        dom.detAvatar.textContent = iniciais(membro.nome);
        dom.detNome.textContent = textoLimpo(membro.nome) || "(sem nome)";
        dom.detId.textContent = `Membro #${membro.id} · GET /membros/${membro.id}`;
        dom.dlgDetalhes.dataset.id = membro.id;

        dom.detCampos.replaceChildren(...[
            ["Ano formativo", rotuloAno(anoEfetivo(membro))],   // [ALTERADO] mostra "Concluído" para consagrado
            ["Etapa formativa", membro.etapa],
            ["Cidade", membro.cidade],
            ["Ministério", membro.ministerio],
            ["Casa de missão", membro.casaMissao]
        ].map(([rotulo, valor]) => el("div", {},
            el("dt", { text: rotulo }),
            el("dd", {}, textoOuTraco(valor)))));

        dom.dlgDetalhes.showModal();
    } catch (erro) {
        avisar(erro.message, "erro");
        if (erro.status === 404 || erro.status >= 500) carregarMembros({ silencioso: true });
    } finally {
        document.body.classList.remove("aguardando");
    }
}

// Caixa de confirmação própria (substitui o confirm() do navegador).
function confirmar(mensagem) {
    return new Promise(resolve => {
        dom.confirmarMensagem.textContent = mensagem;
        dom.dlgConfirmar.returnValue = "";
        dom.dlgConfirmar.addEventListener("close",
            () => resolve(dom.dlgConfirmar.returnValue === "ok"), { once: true });
        dom.dlgConfirmar.showModal();
    });
}

// Fluxo de exclusão: pede confirmação -> DELETE /membros/{id} -> avisa -> recarrega a lista.
async function excluirMembro(id) {
    const membro = estado.membros.find(item => item.id === Number(id));
    const nome = membro ? textoLimpo(membro.nome) : `#${id}`;

    const confirmado = await confirmar(`“${nome}” será removido permanentemente do banco de dados. Esta ação não pode ser desfeita.`);
    if (!confirmado) return;

    document.body.classList.add("aguardando");
    try {
        await api.excluir(id);                                  // DELETE
        avisar("Membro excluído com sucesso!");
        await carregarMembros({ silencioso: true });            // atualiza a interface após o backend confirmar
    } catch (erro) {
        console.error("Falha ao excluir membro:", erro);
        avisar(erro.message, "erro");
        if (erro.status === 404 || erro.status >= 500) carregarMembros({ silencioso: true });
    } finally {
        document.body.classList.remove("aguardando");
    }
}


/* =========================================================================
   7. NAVEGAÇÃO E EVENTOS
   ========================================================================= */

// As "abas" do sistema e os títulos mostrados no topo.
const PAGINAS = {
    dashboard: { titulo: "Dashboard", subtitulo: "Visão geral da Comunidade Recado" },
    membros: { titulo: "Membros", subtitulo: "Cadastre, consulte, edite e exclua membros" }
};

// Rotas por hash (#dashboard, #membros): o botão "voltar" e o F5 funcionam.
function navegar() {
    const nome = location.hash.slice(1);
    const pagina = PAGINAS[nome] ? nome : "dashboard";

    document.querySelectorAll(".pagina").forEach(secao => {
        secao.hidden = secao.dataset.pagina !== pagina;
    });
    document.querySelectorAll(".nav-link").forEach(link => {
        if (link.dataset.pagina === pagina) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
    });

    dom.titulo.textContent = PAGINAS[pagina].titulo;
    dom.subtitulo.textContent = PAGINAS[pagina].subtitulo;
    document.title = `${PAGINAS[pagina].titulo} · Comunidade Recado`;
    window.scrollTo({ top: 0 });
}

// Um único "ouvinte" por tabela/lista (delegação de eventos).
function tratarCliqueEmAcao(evento) {
    const botao = evento.target.closest("button[data-acao]");
    if (!botao) return;

    const id = Number(botao.dataset.id);
    if (botao.dataset.acao === "ver") abrirDetalhes(id);
    if (botao.dataset.acao === "editar") abrirEdicao(id);
    if (botao.dataset.acao === "excluir") excluirMembro(id);
}

// Clique no fundo escuro (fora da caixa) fecha o diálogo.
function fecharAoClicarFora(dialogo, aoFechar) {
    dialogo.addEventListener("click", evento => {
        if (evento.target === dialogo) (aoFechar ?? (() => dialogo.close()))();
    });
}

// Liga cada elemento da tela ao seu comportamento (addEventListener). É chamada uma única vez, na inicialização.
function registrarEventos() {
    window.addEventListener("hashchange", navegar);

    $("ir-para-membros").addEventListener("click", () => { location.hash = "#membros"; });
    $("novo-membro").addEventListener("click", abrirCadastro);
    dom.btnAtualizar.addEventListener("click", () => carregarMembros());

    // Pesquisa dinâmica (a cada tecla) e filtro por ano
    dom.pesquisa.addEventListener("input", () => {
        estado.busca = dom.pesquisa.value;
        atualizarFiltrosVisuais();
        renderizarTabela();
    });
    dom.limparPesquisa.addEventListener("click", () => {
        dom.pesquisa.value = "";
        estado.busca = "";
        atualizarFiltrosVisuais();
        renderizarTabela();
        dom.pesquisa.focus();
    });
    // Filtro por ano: lê data-ano do botão clicado ("todos", "1", "2" ou, [NOVO], "0" = Concluído) e guarda em estado.filtroAno.
    dom.filtrosAno.addEventListener("click", evento => {
        const botao = evento.target.closest("button[data-ano]");
        if (!botao) return;
        estado.filtroAno = botao.dataset.ano;
        atualizarFiltrosVisuais();
        renderizarTabela();
    });

    // Ordenação pelos cabeçalhos
    dom.tabela.querySelector("thead").addEventListener("click", evento => {
        const th = evento.target.closest("th[data-campo]");
        if (!th) return;
        const campo = th.dataset.campo;
        estado.ordem = {
            campo,
            direcao: estado.ordem.campo === campo && estado.ordem.direcao === "asc" ? "desc" : "asc"
        };
        renderizarCabecalhoOrdenacao();
        renderizarTabela();
    });

    // Ações da tabela e do dashboard
    dom.corpoTabela.addEventListener("click", tratarCliqueEmAcao);
    dom.listaRecentes.addEventListener("click", tratarCliqueEmAcao);

    // Formulário
    dom.form.addEventListener("submit", salvarMembro);
    $("fechar-modal").addEventListener("click", fecharFormulario);
    $("cancelar-modal").addEventListener("click", fecharFormulario);
    dom.dlgForm.addEventListener("cancel", evento => { if (estado.salvando) evento.preventDefault(); });
    fecharAoClicarFora(dom.dlgForm, fecharFormulario);
    // Some a mensagem de erro do campo assim que o usuário volta a digitar
    for (const campo of CAMPOS) {
        $(campo).addEventListener("input", () => {
            $(`erro-${campo}`).textContent = "";
            $(campo).removeAttribute("aria-invalid");
        });
    }

    // [NOVO] Ao digitar ou escolher a etapa, o campo Ano é recalculado na hora
    // ("Consagrado" trava em Concluído; outra etapa destrava).
    $("etapa").addEventListener("input", sincronizarAnoComEtapa);

    // Detalhes
    $("det-fechar-x").addEventListener("click", () => dom.dlgDetalhes.close());
    fecharAoClicarFora(dom.dlgDetalhes);
    $("det-editar").addEventListener("click", () => {
        const id = Number(dom.dlgDetalhes.dataset.id);
        dom.dlgDetalhes.close();
        abrirEdicao(id);
    });
    $("det-excluir").addEventListener("click", () => {
        const id = Number(dom.dlgDetalhes.dataset.id);
        dom.dlgDetalhes.close();
        excluirMembro(id);
    });

    // Confirmação
    fecharAoClicarFora(dom.dlgConfirmar);
}


/* =========================================================================
   8. INICIALIZAÇÃO
   ========================================================================= */

// Ordem de partida: liga os eventos, marca a seta de ordenação, mostra a aba da URL e busca os membros na API.
registrarEventos();
renderizarCabecalhoOrdenacao();
navegar();
carregarMembros();      // primeira chamada ao backend: GET /membros