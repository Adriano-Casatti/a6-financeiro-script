// ==UserScript==
// @name         A6 Atalho: SAC - Financeiro Adriano Casatti
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Botões rápidos e seguros para SAC-Financeiro no Integrator 6
// @match        *://integrator6.gegnet.com.br/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    const norm = s => (s || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

    async function selecionarPorTextoSpan(label) {
        await delay(200);
        const alvoNorm = norm(label);
        const spans = Array.from(document.querySelectorAll('span.ng-star-inserted'))
            .filter(el => el.offsetParent !== null);
        const alvo = spans.find(span => norm(span.textContent) === alvoNorm);
        if (alvo) alvo.click();
    }

    async function selecionarDropdown(formcontrolname, label, { tentativas = 15, espera = 150 } = {}) {
        const trigger = document.querySelector(
            `p-dropdown[formcontrolname="${formcontrolname}"] .ui-dropdown-trigger, 
             p-dropdown[formcontrolname="${formcontrolname}"] .p-dropdown-trigger`
        );
        if (!trigger) return false;

        trigger.click();
        await delay(espera);

        const alvo = norm(label);

        for (let i = 0; i < tentativas; i++) {
            const panel =
                document.querySelector('.ui-dropdown-panel[style*="visibility: visible"], .p-dropdown-panel[style*="visibility: visible"]') ||
                document.querySelector('.ui-dropdown-panel:not([style*="display: none"]), .p-dropdown-panel:not([style*="display: none"])');

            const items = panel ? Array.from(panel.querySelectorAll('li[role="option"], li.ui-dropdown-item, li.p-dropdown-item')) : [];

            const opt = items.find(li => {
                const t = norm(li.getAttribute('aria-label') || li.textContent);
                return t === alvo || t.includes(alvo) || alvo.includes(t);
            });

            if (opt) {
                opt.scrollIntoView({ block: 'center' });
                await delay(60);
                opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                opt.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                opt.click();
                await delay(60);
                document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                return true;
            }

            await delay(espera);
        }

        return false;
    }

    const acoesExtras = {
        pagamentoMensalidade: async () => {
            await selecionarPorTextoSpan("SAC - FINANCEIRO - BLOQUEIO POR INADIMPLÊNCIA");
            await selecionarDropdown("codmvis", "SAC - Financeiro - Informar Pagto Mensalidade");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        informacoesBoleto: async () => {
            await selecionarPorTextoSpan("SAC - FINANCEIRO - INFORMAÇÕES SOBRE BOLETO OU NF");
            await selecionarDropdown("codmvis", "SAC - Financeiro - Dúvidas ou Informações");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        habilitacaoProvisoria: async () => {
            await selecionarPorTextoSpan("SAC - FINANCEIRO - BLOQUEIO POR INADIMPLÊNCIA");
            await delay(500);
            await selecionarDropdown("codmvis", "SAC - Financeiro - Habilitação Provisória", { tentativas: 20, espera: 150 });
            await delay(200);
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        centralDoAssinante: async () => {
            await selecionarPorTextoSpan("SAC - FINANCEIRO - CENTRAL DO ASSINANTE");
            await selecionarDropdown("codmvis", "SAC - Financeiro - Central do Assinante");
            await selecionarDropdown("codcatoco", "Administrativo");
        }
    };

    function criarBotao() {
        if (document.getElementById('btn-pagto-mensalidade')) return;

        const categoriaDropdown = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
        if (!categoriaDropdown) return;

        const container = document.createElement('div');
        container.style.margin = '10px 0';

        const botoes = [
            { texto: 'PAGTO MENSALIDADE', acao: acoesExtras.pagamentoMensalidade },
            { texto: 'INF. BOLETO OU NF', acao: acoesExtras.informacoesBoleto },
            { texto: 'HABILITAÇÃO PROV.', acao: acoesExtras.habilitacaoProvisoria },
            { texto: 'CENTRAL DO ASSINANTE', acao: acoesExtras.centralDoAssinante }
        ];

        for (const { texto, acao } of botoes) {
            const btn = document.createElement('button');
            btn.textContent = texto;
            btn.className = 'btn btn-primary';
            btn.style.margin = '0 8px 8px 0';
            btn.style.padding = '4px 10px';
            btn.id = 'btn-' + texto.toLowerCase().replace(/\s/g, '-');
            btn.addEventListener('click', acao);
            container.appendChild(btn);
        }

        categoriaDropdown.parentElement.prepend(container);
    }

    async function aguardarTelaCarregada(tentativas = 10) {
        for (let i = 0; i < tentativas; i++) {
            const categoria = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
            const motivo = document.querySelector('p-dropdown[formcontrolname="codmvis"]');
            const tipo = document.querySelector('span.ng-star-inserted');
            if (categoria && motivo && tipo) return true;
            await delay(500);
        }
        return false;
    }

    async function init() {
        if (!window.location.href.includes('/novo/atendimento-na')) return;

        const ok = await aguardarTelaCarregada();
        if (ok) criarBotao();
    }

    const observer = new MutationObserver(() => {
        init();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('hashchange', () => {
        setTimeout(init, 800);
    });

})();
