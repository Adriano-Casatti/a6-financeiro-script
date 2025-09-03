// ==UserScript==
// @name         A6 Atalho: SAC - Financeiro - Adriano Casatti (Treeview)
// @namespace    http://tampermonkey.net/
// @version      3.8
// @description  Botões rápidos para SAC - Financeiro no Integrator 6, clicando no Tipo de Atendimento na árvore
// @match        *://integrator6.gegnet.com.br/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();

  async function selecionarTipoFinanceiro() {
    // procura o item "SAC - FINANCEIRO" dentro da árvore
    for (let i = 0; i < 20; i++) {
      const nodes = Array.from(document.querySelectorAll('.ui-treenode-content .ui-treenode-label span'));
      const alvo = nodes.find((el) => norm(el.textContent) === 'SAC - FINANCEIRO');
      if (alvo) {
        alvo.scrollIntoView({ block: 'center' });
        await delay(80);
        alvo.click(); // clica no label
        console.log('[A6] Tipo de Atendimento selecionado: SAC - FINANCEIRO');
        return true;
      }
      await delay(200);
    }
    console.warn('[A6] Não foi possível selecionar SAC - FINANCEIRO na árvore.');
    return false;
  }

  async function selecionarDropdown(formcontrolname, label) {
    const dd = document.querySelector(`p-dropdown[formcontrolname="${formcontrolname}"]`);
    if (!dd) return false;

    const trigger = dd.querySelector('.ui-dropdown-trigger, .p-dropdown-trigger');
    trigger?.click();
    await delay(150);

    const alvo = norm(label);
    const items = Array.from(document.querySelectorAll('li[role="option"], li.ui-dropdown-item, li.p-dropdown-item'));
    const opt = items.find((li) => norm(li.textContent) === alvo) ||
      items.find((li) => norm(li.textContent).includes(alvo));
    if (opt) {
      opt.scrollIntoView({ block: 'center' });
      await delay(50);
      opt.click();
      await delay(100);
      document.body.click();
      return true;
    }
    return false;
  }

  const acoes = {
    boletoPix: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Solicitar chave PIX / Boleto');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
    pagamentoMensalidade: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Informar Pagto Mensalidade');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
    duplicidade: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Informar duplicidade de Pagto');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
    informacoesBoletoNF: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Dúvidas ou Informações');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
    nota: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Dúvidas ou Informações');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
    habilitacaoProvisoria: async () => {
      await selecionarTipoFinanceiro();
      await selecionarDropdown('codmvis', 'SAC - Financeiro - Habilitação Provisória');
      await selecionarDropdown('codcatoco', 'Financeiro');
    },
  };

  function criarBotao() {
    if (document.getElementById('a6-botoes-container')) return;

    const categoriaDropdown = document.querySelector('p-dropdown[formcontrolname="codcatoco"]');
    if (!categoriaDropdown) return;

    const container = document.createElement('div');
    container.id = 'a6-botoes-container';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = '6px';
    container.style.margin = '8px 0 10px';

    const botoes = [
      { texto: 'PIX/BOLETO', acao: acoes.boletoPix },
      { texto: 'PAGTO MENSAL', acao: acoes.pagamentoMensalidade },
      { texto: 'DUPLICIDADE', acao: acoes.duplicidade },
      { texto: 'INF. BOLETO/NF', acao: acoes.informacoesBoletoNF },
      { texto: 'NOTA', acao: acoes.nota },
      { texto: 'HABILITAÇÃO PROV.', acao: acoes.habilitacaoProvisoria }
    ];

    botoes.forEach(({ texto, acao }) => {
      const btn = document.createElement('button');
      btn.textContent = texto;
      btn.type = 'button';
      btn.style.fontSize = '11px';
      btn.style.fontWeight = '600';
      btn.style.padding = '4px 7px';
      btn.style.borderRadius = '6px';
      btn.style.minWidth = '100px';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      btn.style.background = '#0d6efd';
      btn.style.color = '#fff';
      btn.style.transition = 'filter .15s ease';
      btn.onmouseenter = () => { btn.style.filter = 'brightness(0.9)'; };
      btn.onmouseleave = () => { btn.style.filter = 'none'; };
      btn.addEventListener('click', acao);
      container.appendChild(btn);
    });

    categoriaDropdown.parentElement.prepend(container);
  }

  async function init() {
    for (let i = 0; i < 20; i++) {
      if (document.querySelector('p-dropdown[formcontrolname="codcatoco"]')) {
        criarBotao();
        return;
      }
      await delay(300);
    }
  }

  init();
  const observer = new MutationObserver(() => init());
  observer.observe(document.body, { childList: true, subtree: true });
})();
