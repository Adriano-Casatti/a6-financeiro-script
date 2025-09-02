// ==UserScript==
// @name         A6 Atalho: SAC - Financeiro - Adriano Casatti
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Botões rápidos e seguros para SAC-Financeiro no Integrator 6 (ajustado para nova estrutura de motivos)
// @match        *://integrator6.gegnet.com.br/*
// @updateURL    https://github.com/Adriano-Casatti/a6-financeiro-script/raw/refs/heads/main/a6-financeiro.user.js
// @downloadURL  https://github.com/Adriano-Casatti/a6-financeiro-script/raw/refs/heads/main/a6-financeiro.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const norm = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

    async function selecionarDropdown(formcontrolname, label, { tentativas = 15, espera = 150 } = {}) {
        const trigger = document.querySelector(
            `p-dropdown[formcontrolname="${formcontrolname}"] .ui-dropdown-trigger,
             p-dropdown[formcontrolname="${formcontrolname}"] .p-dropdown-trigger`
        );
        if (!trigger) return false;

        trigger.click();
        await delay(espera);

        const alvo = norm(label);
        const getText = (li) => li?.getAttribute?.('aria-label') || li?.textContent || '';

        for (let i = 0; i < tentativas; i++) {
            const panel =
                document.querySelector('.ui-dropdown-panel[style*="visibility: visible"], .p-dropdown-panel[style*="visibility: visible"]') ||
                document.querySelector('.ui-dropdown-panel:not([style*="display: none"]), .p-dropdown-panel:not([style*="display: none"])');

            const items = panel ? Array.from(panel.querySelectorAll('li[role="option"], li.ui-dropdown-item, li.p-dropdown-item')) : [];
            let opt = items.find(li => norm(getText(li)) === alvo);

            if (!opt) {
                const candidatos = items.filter(li => norm(getText(li)).includes(alvo));
                if (candidatos.length) opt = candidatos[0];
            }

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
        informacoesBoleto: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Dúvidas ou Informações");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        boletoPix: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Solicitar chave PIX / Boleto");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        pagamentoMensalidade: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Informar Pagto Mensalidade");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        duplicidade: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Informar duplicidade de Pagto");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        habilitacaoProvisoria: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Habilitação Provisória");
            await selecionarDropdown("codcatoco", "Administrativo");
        },
        segundaViaNF: async () => {
            await selecionarDropdown("codmvis", "SAC - Financeiro - Segunda Via NF");
            await selecionarDropdown("codcatoco", "Administrativo");
        }
    };

    function criarBotao() {
        if (document.getElementById('btn-pagto-mensalidade')) return;

        const categoriaDropdown = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
        if (!categoriaDropdown) return;

        const container = document.createElement('div');
        container.style.margin = '10px 0';
        container.style.display = 'flex';
        container.style.flexWrap = 'wrap';
        container.style.gap = '6px';

        const botoes = [
            { texto: 'PIX/BOLETO', acao: acoesExtras.boletoPix },
            { texto: 'PAGTO MENSALIDADE', acao: acoesExtras.pagamentoMensalidade },
            { texto: 'DUPLICIDADE', acao: acoesExtras.duplicidade },
            { texto: 'INF. BOLETO/NF', acao: acoesExtras.informacoesBoleto },
            { texto: 'SEGUNDA VIA NF', acao: acoesExtras.segundaViaNF },
            { texto: 'HABILITAÇÃO PROV.', acao: acoesExtras.habilitacaoProvisoria }
        ];

        for (const { texto, acao } of botoes) {
            const btn = document.createElement('button');
            btn.textContent = texto;
            btn.style.fontSize = '11px';
            btn.style.fontWeight = 'bold';
            btn.style.padding = '4px 6px';
            btn.style.borderRadius = '6px';
            btn.style.minWidth = '100px';
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.style.backgroundColor = '#007bff';
            btn.style.color = '#fff';
            btn.style.transition = 'background-color 0.2s ease';

            btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = '#0056b3'; });
            btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = '#007bff'; });

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
            if (categoria && motivo) return true;
            await delay(500);
        }
        return false;
    }

    async function init() {
        if (!window.location.href.includes('/novo/atendimento-na')) return;
        const ok = await aguardarTelaCarregada();
        if (ok) criarBotao();
    }

    const observer = new MutationObserver(() => init());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(init, 800));
})();
