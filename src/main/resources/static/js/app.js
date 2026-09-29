let membros = [];
let membroEditando = null;


/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", () => {

    lucide.createIcons();

    carregarMembros();

});


/* =========================
   API
========================= */

async function carregarMembros() {

    try {

        const resposta = await fetch("/membros");

        if (!resposta.ok) {
            throw new Error("Erro ao carregar membros.");
        }

        membros = await resposta.json();

        atualizarDashboard();

        renderizarMembros(membros);

    } catch (erro) {

        console.error(erro);

        mostrarToast(
            "Erro",
            "Não foi possível carregar os membros."
        );

    }

}


/* =========================
   RENDER
========================= */

function renderizarMembros(lista) {

    const tabela = document.getElementById("tabelaMembros");
    const estadoVazio = document.getElementById("estadoVazio");

    tabela.innerHTML = "";


    if (lista.length === 0) {

        tabela.style.display = "none";
        estadoVazio.style.display = "block";

        return;

    }


    tabela.style.display = "table";
    estadoVazio.style.display = "none";


    lista.forEach(membro => {

        const tr = document.createElement("tr");

        const iniciais = obterIniciais(membro.nome);

        const classeEtapa =
            normalizarClasse(membro.etapa);


        tr.innerHTML = `

            <td>

                <div class="member-name">

                    <div class="avatar">
                        ${iniciais}
                    </div>

                    <div>

                        <strong>
                            ${escaparHTML(membro.nome)}
                        </strong>

                        <span>
                            Entrada: ${membro.ano}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escaparHTML(membro.cidade)}
            </td>


            <td>
                ${escaparHTML(membro.ministerio)}
            </td>


            <td>

                <span class="badge badge-${classeEtapa}">
                    ${formatarTexto(membro.etapa)}
                </span>

            </td>


            <td>
                ${formatarTexto(membro.casaMissao)}
            </td>


            <td>

                <div class="actions">

                    <button
                        class="action-button"
                        title="Editar"
                        onclick="editarMembro(${membro.id})"
                    >
                        <i data-lucide="pencil"></i>
                    </button>


                    <button
                        class="action-button delete"
                        title="Excluir"
                        onclick="excluirMembro(${membro.id})"
                    >
                        <i data-lucide="trash-2"></i>
                    </button>

                </div>

            </td>

        `;


        tabela.appendChild(tr);

    });


    lucide.createIcons();

}


/* =========================
   PESQUISA
========================= */

function filtrarMembros() {

    const pesquisa =
        document
            .getElementById("campoPesquisa")
            .value
            .toLowerCase()
            .trim();


    const etapa =
        document
            .getElementById("filtroEtapa")
            .value;


    const casa =
        document
            .getElementById("filtroCasa")
            .value;


    const resultado = membros.filter(membro => {

        const textoPesquisa = `

            ${membro.nome}
            ${membro.cidade}
            ${membro.ministerio}
            ${membro.ano}

        `.toLowerCase();


        const correspondePesquisa =
            !pesquisa ||
            textoPesquisa.includes(pesquisa);


        const correspondeEtapa =
            !etapa ||
            membro.etapa === etapa;


        const correspondeCasa =
            !casa ||
            membro.casaMissao === casa;


        return (
            correspondePesquisa &&
            correspondeEtapa &&
            correspondeCasa
        );

    });


    renderizarMembros(resultado);

}


/* =========================
   DASHBOARD
========================= */

function atualizarDashboard() {

    document.getElementById("totalMembros")
        .textContent = membros.length;


    const casas = new Set(
        membros.map(m => m.casaMissao)
    );

    document.getElementById("totalCasas")
        .textContent = casas.size;


    const ministerios = new Set(
        membros.map(m => m.ministerio)
    );

    document.getElementById("totalMinisterios")
        .textContent = ministerios.size;

}


/* =========================
   MODAL
========================= */

function abrirModal(membro = null) {

    membroEditando = membro;

    const modal =
        document.getElementById("modal");


    document.getElementById("formMembro")
        .reset();


    if (membro) {

        document.getElementById("tituloModal")
            .textContent = "Editar membro";


        document.getElementById("membroId")
            .value = membro.id;


        document.getElementById("nome")
            .value = membro.nome;


        document.getElementById("ano")
            .value = membro.ano;


        document.getElementById("cidade")
            .value = membro.cidade;


        document.getElementById("ministerio")
            .value = membro.ministerio;


        document.getElementById("etapa")
            .value = membro.etapa;


        document.getElementById("casaMissao")
            .value = membro.casaMissao;

    } else {

        document.getElementById("tituloModal")
            .textContent = "Novo membro";

    }


    modal.classList.add("active");

    setTimeout(() => {
        document.getElementById("nome").focus();
    }, 100);

}


function fecharModal() {

    document
        .getElementById("modal")
        .classList.remove("active");

    membroEditando = null;

}


/* =========================
   FORMULÁRIO
========================= */

document
    .getElementById("formMembro")
    .addEventListener("submit", async event => {

        event.preventDefault();


        const membro = {

            nome:
            document.getElementById("nome").value,

            ano:
                Number(
                    document.getElementById("ano").value
                ),

            cidade:
            document.getElementById("cidade").value,

            ministerio:
            document.getElementById("ministerio").value,

            etapa:
            document.getElementById("etapa").value,

            casaMissao:
            document.getElementById("casaMissao").value

        };


        try {

            let resposta;


            if (membroEditando) {

                resposta = await fetch(
                    `/membros/${membroEditando.id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(membro)
                    }
                );

            } else {

                resposta = await fetch(
                    "/membros",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify(membro)
                    }
                );

            }


            if (!resposta.ok) {
                throw new Error();
            }


            fecharModal();

            await carregarMembros();


            mostrarToast(
                "Sucesso",
                membroEditando
                    ? "Membro atualizado."
                    : "Membro cadastrado."
            );


        } catch (erro) {

            mostrarToast(
                "Erro",
                "Não foi possível salvar o membro."
            );

        }

    });


/* =========================
   EDITAR
========================= */

function editarMembro(id) {

    const membro =
        membros.find(m => m.id === id);


    if (!membro) {
        return;
    }


    abrirModal(membro);

}


/* =========================
   EXCLUIR
========================= */

async function excluirMembro(id) {

    const membro =
        membros.find(m => m.id === id);


    if (!membro) {
        return;
    }


    const confirmar =
        confirm(
            `Deseja realmente excluir "${membro.nome}"?`
        );


    if (!confirmar) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `/membros/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!resposta.ok) {
            throw new Error();
        }


        await carregarMembros();


        mostrarToast(
            "Membro removido",
            `${membro.nome} foi excluído.`
        );


    } catch (erro) {

        mostrarToast(
            "Erro",
            "Não foi possível excluir o membro."
        );

    }

}


/* =========================
   TOAST
========================= */

function mostrarToast(titulo, mensagem) {

    const toast =
        document.getElementById("toast");


    document.getElementById("toastTitulo")
        .textContent = titulo;


    document.getElementById("toastMensagem")
        .textContent = mensagem;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}


/* =========================
   UTILITÁRIOS
========================= */

function obterIniciais(nome) {

    if (!nome) {
        return "?";
    }


    const partes =
        nome.trim().split(" ");


    if (partes.length === 1) {
        return partes[0][0].toUpperCase();
    }


    return (
        partes[0][0] +
        partes[partes.length - 1][0]
    ).toUpperCase();

}


function formatarTexto(texto) {

    if (!texto) {
        return "-";
    }


    return texto
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, letra =>
            letra.toUpperCase()
        );

}


function normalizarClasse(texto) {

    if (!texto) {
        return "";
    }


    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s/g, "-");

}


function escaparHTML(texto) {

    if (texto === null || texto === undefined) {
        return "";
    }


    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function scrollToMembers() {

    document
        .getElementById("membersSection")
        .scrollIntoView({
            behavior: "smooth"
        });

}