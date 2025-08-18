// ==UserScript==
// @name         SZ Chat - Copiar Cada Dado Individualmente - Adriano Casatti
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Ícones discretos para copiar CPF, CNPJ, telefone e e-mail no SZ Chat, mesmo que estejam juntos na mesma mensagem.
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
        icon.textContent = '⧉';
        icon.style.marginLeft = '4px';
        icon.style.cursor = 'pointer';
        icon.style.fontSize = '12px';
        icon.style.opacity = '0.5';
        icon.style.transition = 'opacity 0.2s ease';
        icon.title = 'Copiar';

        icon.addEventListener('mouseover', () => icon.style.opacity = '0.8');
        icon.addEventListener('mouseout', () => icon.style.opacity = '0.5');

        icon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigator.clipboard.writeText(textoParaCopiar).then(() => {
                icon.textContent = '✅';
                icon.style.opacity = '0.8';
                setTimeout(() => {
                    icon.textContent = '⧉';
                    icon.style.opacity = '0.5';
                }, 1000);
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
            const index = args[args.length - 2];
            fragment.appendChild(document.createTextNode(textoOriginal.slice(ultimoIndex, index)));

            const spanDado = document.createElement('span');
            spanDado.textContent = match;
            spanDado.style.fontWeight = '500';
            spanDado.style.color = '#777'; 
            spanDado.style.transition = 'color 0.2s ease';
            spanDado.addEventListener('mouseover', () => spanDado.style.color = '#444');
            spanDado.addEventListener('mouseout', () => spanDado.style.color = '#777');

            fragment.appendChild(spanDado);
            fragment.appendChild(criarIcone(match));

            ultimoIndex = index + match.length;
        });

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
