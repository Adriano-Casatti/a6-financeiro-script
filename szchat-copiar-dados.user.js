// ==UserScript==
// @name         SZ Chat - Copiar Cada Dado Individualmente - Adriano Casatti
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Adiciona ícones 📋 para copiar cada CPF, CNPJ, telefone e e-mail no SZ Chat, mesmo que estejam juntos na mesma mensagem.
// @match        https://clusterscpr.sz.chat/user/agent*
// @updateURL    https://raw.githubusercontent.com/Adriano-Casatti/a6-financeiro-script/main/szchat-copiar-dados.user.js
// @downloadURL  https://raw.githubusercontent.com/Adriano-Casatti/a6-financeiro-script/main/szchat-copiar-dados.user.js
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const regexGeral = /(\b\d{3}\.\d{3}\.\d{3}-\d{2}\b)|(\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b)|(\b\d{2} ?9?\d{4}-?\d{4}\b)|(\b\d{10,11}\b)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    function criarIcone(textoParaCopiar) {
        const icon = document.createElement('span');
        icon.textContent = '📋';
        icon.style.marginLeft = '4px';
        icon.style.cursor = 'pointer';
        icon.style.fontSize = '13px';
        icon.title = 'Clique para copiar';

        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(textoParaCopiar).then(() => {
                icon.textContent = '✅';
                setTimeout(() => { icon.textContent = '📋'; }, 1000);
            });
        });

        return icon;
    }

    function processarElemento(el) {
        const textoOriginal = el.textContent;
        if (!regexGeral.test(textoOriginal)) return;

        const fragment = document.createDocumentFragment();
        let ultimoIndex = 0;

        textoOriginal.replace(regexGeral, (match, ...args) => {
            const index = args[args.length - 2]; // posição do match
            // Texto antes do dado
            fragment.appendChild(document.createTextNode(textoOriginal.slice(ultimoIndex, index)));
            // O próprio dado
            const spanDado = document.createElement('span');
            spanDado.textContent = match;
            spanDado.style.fontWeight = 'bold';
            spanDado.style.color = '#00BFFF';
            fragment.appendChild(spanDado);
            // Ícone de copiar
            fragment.appendChild(criarIcone(match));
            ultimoIndex = index + match.length;
        });

        // Texto depois do último dado
        fragment.appendChild(document.createTextNode(textoOriginal.slice(ultimoIndex)));

        el.replaceWith(fragment);
    }

    const observer = new MutationObserver(() => {
        const elementos = document.querySelectorAll('.message span:not([data-copiado]), .message a:not([data-copiado])');
        elementos.forEach(el => {
            if (regexGeral.test(el.textContent)) {
                el.setAttribute('data-copiado', 'true');
                processarElemento(el);
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
