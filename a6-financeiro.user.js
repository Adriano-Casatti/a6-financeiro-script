// ==UserScript==
// @name         A6 Atalho: SAC - Financeiro (Estável e Funcional)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Botões automáticos no SAC Financeiro com estabilidade
// @match        *://integrator6.gegnet.com.br/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function selecionarTipoPorTexto(texto) {
        await delay(200);
        const spans = Array.from(document.querySelectorAll('span.ng-star-inserted')).filter(s => s.offsetParent !== null);
        const alvo = spans.find(s => s.textContent.trim() === texto);
        if (alvo) alvo.click();
    }

    async function selecionarDropdownPorFormControl(name, label) {
        const trigger = document.querySelector(`p-dropdown[formcontrolname="${name}"] .ui-dropdown-trigger`);
        if (!trigger) return;
        trigger.click();
        await delay(200);

        const opcoes = Array.from(document.querySelectorAll('li[role="option"]'));
        const opcao = opcoes.find(opt => opt.getAttribute('aria-label')?.trim() === label);
        if (opcao) opcao.click();
    }

    const acoes = {
        pagamentoMensalidade: async () => {
            await selecionarTipoPorTexto("SAC - FINANCEIRO - BLOQUEIO POR INADIMPLÊNCIA");
            await selecionarDropdownPorFormControl('codcatoco', 'Administrativo');
            await selecionarDropdownPorFormControl('codmvis', 'SAC - Financeiro - Informar Pagto Mensalidade');
        },
        informacoesBoleto: async () => {
            await selecionarTipoPorTexto("SAC - FINANCEIRO - INFORMAÇÕES SOBRE BOLETO OU NF");
            await selecionarDropdownPorFormControl('codcatoco', 'Administrativo');
            await selecionarDropdownPorFormControl('codmvis', 'SAC - Financeiro - Dúvidas ou Informações');
        },
        habilitacaoProvisoria: async () => {
            await selecionarTipoPorTexto("SAC - FINANCEIRO - BLOQUEIO POR INADIMPLÊNCIA");
            await selecionarDropdownPorFormControl('codcatoco', 'Administrativo');
            await selecionarDropdownPorFormControl('codmvis', 'SAC - Financeiro - Habilitação Provisória');
        },
        centralDoAssinante: async () => {
            await selecionarTipoPorTexto("SAC - FINANCEIRO - CENTRAL DO ASSINANTE");
            await selecionarDropdownPorFormControl('codcatoco', 'Administrativo');
            await selecionarDropdownPorFormControl('codmvis', 'SAC - Financeiro - Central do Assinante');
        }
    };

    function criarBotoes() {
        if (document.querySelector('#painel-sacf')) return;

        const dropdownCategoria = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
        if (!dropdownCategoria) return;

        const painel = document.createElement('div');
        painel.id = 'painel-sacf';
        painel.style.margin = '10px 0';

        const botoes = [
            { texto: 'PAGTO MENSALIDADE', acao: acoes.pagamentoMensalidade },
            { texto: 'INF. BOLETO OU NF', acao: acoes.informacoesBoleto },
            { texto: 'HABILITAÇÃO PROV.', acao: acoes.habilitacaoProvisoria },
            { texto: 'CENTRAL DO ASSINANTE', acao: acoes.centralDoAssinante }
        ];

        botoes.forEach(({ texto, acao }) => {
            const btn = document.createElement('button');
            btn.textContent = texto;
            btn.className = 'btn btn-primary';
            btn.style.margin = '0 8px 8px 0';
            btn.onclick = acao;
            painel.appendChild(btn);
        });

        dropdownCategoria.parentElement.prepend(painel);
    }

    function aguardarCarregamento() {
        const interval = setInterval(() => {
            const categoriaDropdown = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
            if (location.href.includes('/novo/atendimento-na') && categoriaDropdown) {
                clearInterval(interval);
                criarBotoes();
            }
        }, 500);
    }

    // Aciona na primeira carga
    window.addEventListener('load', aguardarCarregamento);

    // Aciona a cada mudança de hash (ex: trocar de tela)
    window.addEventListener('hashchange', () => {
        setTimeout(aguardarCarregamento, 500);
    });
})();
