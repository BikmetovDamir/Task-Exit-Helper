// ==UserScript==
// @name         Task Exit Helper
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Генерация штрихкодов из значений в скобках, а также значений, начинающихся с "bx" и "us" рядом с текстом ФИО
// @author       Bikmetov Damir
// @match        https://wms-frontend-batching.wms.o3.ru/23128509046000/batch*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.11.0/JsBarcode.all.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let debounceTimeout;

    // Функция для поиска значений с префиксами "us" и "bx" рядом с текстом ФИО
    function extractValues() {
        const results = [];
        const regexParentheses = /\((\d+)\)/g;

        // Поиск значений в скобках
        let matches;
        while ((matches = regexParentheses.exec(document.body.innerText)) !== null) {
            if (matches[1]) {
                results.push('us' + matches[1]);
            }
        }

        const tableCells = document.querySelectorAll('.ant-table-cell');

        tableCells.forEach(cell => {
            const cellText = cell.innerText.trim();
            if (cellText.startsWith('bx') || cellText.startsWith('us')) {
                // Проверяем соседние ячейки на наличие текста ФИО
                let hasFIO = false;

                // Проверяем предыдущую ячейку
                const previousSibling = cell.previousElementSibling;
                if (previousSibling && previousSibling.innerText.trim().match(/[А-ЯЁа-яё\s]+/)) {
                    hasFIO = true;
                }

                // Проверяем следующую ячейку
                const nextSibling = cell.nextElementSibling;
                if (nextSibling && nextSibling.innerText.trim().match(/[А-ЯЁа-яё\s]+/)) {
                    hasFIO = true;
                }

                // Если рядом с "bx" или "us" есть текст ФИО, добавляем значение
                if (hasFIO) {
                    results.push(cellText);
                }
            }
        });

        return results;
    }

    // Функция для отображения штрихкодов
    function displayBarcodes(barcodes) {
        const existingContainer = document.getElementById('barcode-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        const container = document.createElement('div');
        container.id = 'barcode-container';
        container.style.position = 'fixed';
        container.style.top = '50%';
        container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        container.style.zIndex = '9999';
        container.style.textAlign = 'center';
        container.style.backgroundColor = 'white';
        container.style.padding = '20px';
        container.style.border = '1px solid black';
        container.style.borderRadius = '10px';

        if (barcodes.length > 0) {
            barcodes.forEach(barcode => {
                const img = document.createElement('img');
                img.style.width = '200px'; // Устанавливаем фиксированную ширину
                img.style.height = 'auto'; // Высота будет пропорциональна ширине
                img.style.margin = '20px 0'; // Увеличиваем расстояние между штрихкодами
                try {
                    JsBarcode(img, barcode, { format: "CODE128" });
                    container.appendChild(img);
                    container.appendChild(document.createElement('br'));
                } catch (error) {
                    console.error("Ошибка генерации штрихкода:", error);
                }
            });
        } else {
            const message = document.createElement('p');
            message.innerText = "Открытых тар нет";
            container.appendChild(message);
        }

        document.body.appendChild(container);

        // Проверка для "Конвейер"
        let barcodeValue = '';
        const text = document.body.innerText;
        const barcodeMap = {};

        // Функция для добавления значений в barcodeMap
        const addBarcodes = (baseCode, keys) => {
                keys.forEach(key => {
                    barcodeMap[key] = baseCode;
                });
        };
            // Группируем по значениям
        addBarcodes('cl35883203', ['1А1', '1 БЛОК 1 ЭТАЖ N']);
        addBarcodes('cl35883198', ['1Г1']);
        addBarcodes('cl35883213', ['2А1', '1 БЛОК 2 ЭТАЖ N']);
        addBarcodes('cl35883208', ['2Г1']);
        addBarcodes('cl35883223', ['3А1', '3Б1', '1 БЛОК 3 ЭТАЖ N']);
        addBarcodes('cl35883218', ['3Г1', '3В1']);
        addBarcodes('cl35883233', ['4А1', '4Б1', '1 БЛОК 4 ЭТАЖ N']);
        addBarcodes('cl35883228', ['4Г1', '4В1']);
        addBarcodes('cl35883243', ['5А1', '5Б1', '1 БЛОК 5 ЭТАЖ N']);
        addBarcodes('cl35883238', ['5Г1', '5В1']);
        addBarcodes('cl35883253', ['6А1', '6А2', '6Б1', '1 БЛОК 6 ЭТАЖ N']);
        addBarcodes('cl35883248', ['6Г1', '6В1']);
        addBarcodes('cl81721306', ['1К1', '3 БЛОК 1 ЭТАЖ N']);
        addBarcodes('cl81721318', ['1Н1']);
        addBarcodes('cl81723440', ['2К1', '3 БЛОК 2 ЭТАЖ N']);
        addBarcodes('cl81723472', ['2Н1']);
        addBarcodes('cl81723486', ['3К1', '3Л1', '3 БЛОК 3 ЭТАЖ N']);
        addBarcodes('cl81725844', ['3Н1', '3М1']);
        addBarcodes('cl81728869', ['4К1', '4Л1', '3 БЛОК 4 ЭТАЖ N']);
        addBarcodes('cl81728857', ['4Н1', '4М1']);
        addBarcodes('cl81766752', ['5К1', '5Л1', '3 БЛОК 5 ЭТАЖ N']);
        addBarcodes('cl81771050', ['5Н1', '5М1']);
        addBarcodes('cl81774621', ['6К1', '6К2', '6Л1', '3 БЛОК 6 ЭТАЖ N']);
        addBarcodes('cl81771061', ['6Н1', '6М1']);
        addBarcodes('cl43510857', ['Подбор ЗЗ']);

        for (const [key, value] of Object.entries(barcodeMap)) {
            if (text.includes(key)) {
                barcodeValue = value;
                break; // Выходим из цикла, если нашли совпадение
            }
        }

        // Проверка для "Нон-сорт"
        let conveyorBarcodeValue = '';
        if (text.includes('1 БЛОК 1 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl35883204';
        } else if (text.includes('1 БЛОК 2 ЭТАЖ ')) {
            conveyorBarcodeValue = 'cl35883214';
        } else if (text.includes('1 БЛОК 3 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl35883224';
        } else if (text.includes('1 БЛОК 4 ЭТАЖ ')) {
            conveyorBarcodeValue = 'cl35883234';
        } else if (text.includes('1 БЛОК 5 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl35883244';
        } else if (text.includes('1 БЛОК 6 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl35883254';
        } else if (text.includes('3 БЛОК 1 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81721307';
        } else if (text.includes('3 БЛОК 2 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81723441';
        } else if (text.includes('3 БЛОК 3 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81723487';
        } else if (text.includes('3 БЛОК 4 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81728870';
        } else if (text.includes('3 БЛОК 5 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81766753';
        } else if (text.includes('3 БЛОК 6 ЭТАЖ')) {
            conveyorBarcodeValue = 'cl81774622';
        } else if (text.includes('Подбор ЗЗ')) {
            conveyorBarcodeValue = 'cl43510858';
        }

        // Если найдено значение, создаем контейнер для штрихкода
        if (barcodeValue) {
            const resetContainer = document.createElement('div');
            resetContainer.style.position = 'fixed';
            resetContainer.style.bottom = '55%';
            resetContainer.style.right = '100px';
            resetContainer.style.zIndex = '9999';
            resetContainer.style.textAlign = 'center';
            resetContainer.style.backgroundColor = 'white';
            resetContainer.style.padding = '10px';
            resetContainer.style.border = '1px solid black';
            resetContainer.style.borderRadius = '10px';

            const label = document.createElement('p');
            label.innerText = "Конвейер";
            label.style.fontSize = '20px'; // Увеличиваем размер шрифта
            label.style.fontWeight = 'bold'; // Делаем текст жирным
            resetContainer.appendChild(label);

            const resetImg = document.createElement('img');
            resetImg.style.width = '200px'; // Устанавливаем фиксированную ширину для штрихкода сброса
            resetImg.style.height = 'auto'; // Высота будет пропорциональна ширине
            JsBarcode(resetImg, barcodeValue, { format: "CODE128" });
            resetContainer.appendChild(resetImg);

            document.body.appendChild(resetContainer);
        }

        // Создаем контейнер для "Конвейер"
        if (conveyorBarcodeValue) {
            const conveyorContainer = document.createElement('div');
            conveyorContainer.style.position = 'fixed';
            conveyorContainer.style.bottom = '25%'; // Расстояние от нижней части экрана
            conveyorContainer.style.right = '100px';
            conveyorContainer.style.zIndex = '9999';
            conveyorContainer.style.textAlign = 'center';
            conveyorContainer.style.backgroundColor = 'white';
            conveyorContainer.style.padding = '10px';
            conveyorContainer.style.border = '1px solid black';
            conveyorContainer.style.borderRadius = '10px';

            const conveyorLabel = document.createElement('p');
            conveyorLabel.innerText = "Нон-сорт";
            conveyorLabel.style.fontSize = '20px';
            conveyorLabel.style.fontWeight = 'bold';
            conveyorContainer.appendChild(conveyorLabel);

            const conveyorImg = document.createElement('img');
            conveyorImg.style.width = '200px'; // Устанавливаем фиксированную ширину для штрихкода "Конвейер"
            conveyorImg.style.height = 'auto'; // Высота будет пропорциональна ширине
            JsBarcode(conveyorImg, conveyorBarcodeValue, { format: "CODE128" });
            conveyorContainer.appendChild(conveyorImg);

            document.body.appendChild(conveyorContainer);
        }
    }

    // Функция для проверки и отображения штрихкодов с debounce
    function checkAndDisplayBarcodes() {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const barcodes = extractValues();
            displayBarcodes(barcodes);
        }, 150); // Задержка в 150 мс
    }

    // Обработчик события visibilitychange
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            checkAndDisplayBarcodes(); // Обновляем данные, когда вкладка становится видимой
        }
    });

    // Настройка MutationObserver для отслеживания изменений в DOM
    const observer = new MutationObserver(() => {
        checkAndDisplayBarcodes();
    });

    // Начинаем наблюдение за изменениями в body
    observer.observe(document.body, { childList: true, subtree: true });

    // Первоначальная проверка сразу после загрузки
    checkAndDisplayBarcodes();
})();
