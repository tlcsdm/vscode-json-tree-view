(function () {
    // @ts-check
    'use strict';

    /** @type {ReturnType<typeof acquireVsCodeApi>} */
    const vscode = acquireVsCodeApi();

    let jsonData = null;
    let searchMatches = [];
    let currentMatchIndex = -1;

    const treeContainer = document.getElementById('tree-container');
    const searchInput = document.getElementById('searchInput');
    const searchPrev = document.getElementById('searchPrev');
    const searchNext = document.getElementById('searchNext');
    const searchCount = document.getElementById('searchCount');
    const jsonataInput = document.getElementById('jsonataInput');
    const jsonataResult = document.getElementById('jsonataResult');
    const expandAllBtn = document.getElementById('expandAll');
    const collapseAllBtn = document.getElementById('collapseAll');
    const reloadBtn = document.getElementById('reloadFile');

    // Toolbar buttons
    expandAllBtn.addEventListener('click', () => {
        const children = treeContainer.querySelectorAll('.tree-node-children');
        children.forEach(child => child.classList.remove('hidden'));
        const toggles = treeContainer.querySelectorAll('.toggle.collapsed');
        toggles.forEach(toggle => {
            toggle.classList.remove('collapsed');
            toggle.classList.add('expanded');
        });
    });

    collapseAllBtn.addEventListener('click', () => {
        const children = treeContainer.querySelectorAll('.tree-node-children');
        children.forEach(child => child.classList.add('hidden'));
        const toggles = treeContainer.querySelectorAll('.toggle.expanded');
        toggles.forEach(toggle => {
            toggle.classList.remove('expanded');
            toggle.classList.add('collapsed');
        });
    });

    reloadBtn.addEventListener('click', () => {
        vscode.postMessage({ type: 'reload' });
    });

    // Search
    let searchDebounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => performSearch(), 200);
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                navigateSearch(-1);
            } else {
                navigateSearch(1);
            }
        }
    });

    searchPrev.addEventListener('click', () => navigateSearch(-1));
    searchNext.addEventListener('click', () => navigateSearch(1));

    // JSONata
    let jsonataDebounce = null;
    jsonataInput.addEventListener('input', () => {
        clearTimeout(jsonataDebounce);
        jsonataDebounce = setTimeout(() => {
            const expression = jsonataInput.value.trim();
            if (expression) {
                vscode.postMessage({ type: 'jsonata', expression });
            } else {
                jsonataResult.textContent = 'Result...';
            }
        }, 500);
    });

    jsonataInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const expression = jsonataInput.value.trim();
            if (expression) {
                vscode.postMessage({ type: 'jsonata', expression });
            }
        }
    });

    // Context menu
    let activeContextMenu = null;

    document.addEventListener('click', () => {
        removeContextMenu();
    });

    document.addEventListener('contextmenu', (e) => {
        const header = e.target.closest('.tree-node-header');
        if (header) {
            e.preventDefault();
            removeContextMenu();
            showContextMenu(e.clientX, e.clientY, header);
        }
    });

    function removeContextMenu() {
        if (activeContextMenu) {
            activeContextMenu.remove();
            activeContextMenu = null;
        }
    }

    function showContextMenu(x, y, header) {
        const menu = document.createElement('div');
        menu.className = 'context-menu';

        const valueEl = header.querySelector('.node-value');
        const value = valueEl ? valueEl.textContent : '';

        const copyItem = document.createElement('div');
        copyItem.className = 'context-menu-item';
        copyItem.textContent = 'Copy Value';
        copyItem.addEventListener('click', (e) => {
            e.stopPropagation();
            vscode.postMessage({ type: 'copyValue', value });
            removeContextMenu();
        });
        menu.appendChild(copyItem);

        const copyKeyItem = document.createElement('div');
        copyKeyItem.className = 'context-menu-item';
        copyKeyItem.textContent = 'Copy Key';
        copyKeyItem.addEventListener('click', (e) => {
            e.stopPropagation();
            const keyEl = header.querySelector('.node-key');
            const key = keyEl ? keyEl.textContent.replace(/:$/, '') : '';
            vscode.postMessage({ type: 'copyValue', value: key });
            removeContextMenu();
        });
        menu.appendChild(copyKeyItem);

        // Position the menu
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        document.body.appendChild(menu);

        // Adjust if off-screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = (window.innerWidth - rect.width - 4) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = (window.innerHeight - rect.height - 4) + 'px';
        }

        activeContextMenu = menu;
    }

    // Message handling
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.type) {
            case 'setData':
                jsonData = message.data;
                renderTree(jsonData, message.fileName);
                break;
            case 'jsonataResult':
                jsonataResult.textContent = message.result;
                break;
            case 'error':
                treeContainer.innerHTML = '<div style="color: var(--vscode-errorForeground); padding: 16px;">' +
                    escapeHtml(message.message) + '</div>';
                break;
        }
    });

    function renderTree(data, fileName) {
        treeContainer.innerHTML = '';
        if (data === null || data === undefined) {
            treeContainer.innerHTML = '<div style="padding: 16px; color: var(--vscode-descriptionForeground);">No data</div>';
            return;
        }

        const rootLabel = fileName ? fileName.split(/[/\\]/).pop() : 'Root';
        const rootNode = createTreeNode('Root', data, rootLabel, true);
        treeContainer.appendChild(rootNode);
    }

    function createTreeNode(key, value, label, isRoot) {
        const node = document.createElement('div');
        node.className = 'tree-node';

        const header = document.createElement('div');
        header.className = 'tree-node-header';

        const toggle = document.createElement('span');
        toggle.className = 'toggle';

        const icon = document.createElement('span');
        icon.className = 'node-icon';

        if (value !== null && typeof value === 'object') {
            const isArray = Array.isArray(value);
            const keys = Object.keys(value);
            const hasChildren = keys.length > 0;

            toggle.className = hasChildren ? 'toggle expanded' : 'toggle leaf';
            icon.className = isArray ? 'node-icon array' : 'node-icon object';

            const keySpan = document.createElement('span');
            keySpan.className = 'node-key';

            if (isRoot) {
                keySpan.textContent = label + ':';
            } else {
                keySpan.textContent = key + ':';
            }

            const info = document.createElement('span');
            info.className = 'node-info';
            if (isArray) {
                info.textContent = '(' + keys.length + ' items)';
            } else {
                info.textContent = '(' + keys.length + ' keys)';
            }

            header.appendChild(toggle);
            header.appendChild(icon);
            header.appendChild(keySpan);
            header.appendChild(info);

            if (hasChildren) {
                const childrenContainer = document.createElement('div');
                childrenContainer.className = 'tree-node-children';

                keys.forEach(childKey => {
                    const childNode = createTreeNode(childKey, value[childKey], null, false);
                    childrenContainer.appendChild(childNode);
                });

                header.addEventListener('click', () => {
                    const isExpanded = toggle.classList.contains('expanded');
                    if (isExpanded) {
                        toggle.classList.remove('expanded');
                        toggle.classList.add('collapsed');
                        childrenContainer.classList.add('hidden');
                    } else {
                        toggle.classList.remove('collapsed');
                        toggle.classList.add('expanded');
                        childrenContainer.classList.remove('hidden');
                    }
                });

                node.appendChild(header);
                node.appendChild(childrenContainer);
            } else {
                node.appendChild(header);
            }
        } else {
            toggle.className = 'toggle leaf';

            if (value === null) {
                icon.className = 'node-icon null';
            } else if (typeof value === 'string') {
                icon.className = 'node-icon string';
            } else if (typeof value === 'number') {
                icon.className = 'node-icon number';
            } else if (typeof value === 'boolean') {
                icon.className = 'node-icon boolean';
            } else {
                icon.className = 'node-icon string';
            }

            const keySpan = document.createElement('span');
            keySpan.className = 'node-key';
            keySpan.textContent = key + ':';

            const separator = document.createElement('span');
            separator.className = 'node-separator';
            separator.textContent = ' ';

            const valueSpan = document.createElement('span');
            valueSpan.className = 'node-value';

            if (value === null) {
                valueSpan.classList.add('null');
                valueSpan.textContent = 'null';
            } else if (typeof value === 'string') {
                valueSpan.classList.add('string');
                valueSpan.textContent = value;
            } else if (typeof value === 'number') {
                valueSpan.classList.add('number');
                valueSpan.textContent = String(value);
            } else if (typeof value === 'boolean') {
                valueSpan.classList.add('boolean');
                valueSpan.textContent = String(value);
            } else {
                valueSpan.textContent = String(value);
            }

            header.appendChild(toggle);
            header.appendChild(icon);
            header.appendChild(keySpan);
            header.appendChild(separator);
            header.appendChild(valueSpan);

            node.appendChild(header);
        }

        return node;
    }

    function performSearch() {
        // Clear previous highlights
        const prevHighlights = treeContainer.querySelectorAll('.highlight, .active-highlight');
        prevHighlights.forEach(el => {
            el.classList.remove('highlight', 'active-highlight');
        });

        searchMatches = [];
        currentMatchIndex = -1;

        const query = searchInput.value.trim().toLowerCase();
        if (!query) {
            searchCount.textContent = '';
            return;
        }

        const headers = treeContainer.querySelectorAll('.tree-node-header');
        headers.forEach(header => {
            const text = header.textContent.toLowerCase();
            if (text.includes(query)) {
                header.classList.add('highlight');
                searchMatches.push(header);
            }
        });

        searchCount.textContent = searchMatches.length + ' matches';

        if (searchMatches.length > 0) {
            currentMatchIndex = 0;
            highlightCurrentMatch();
        }
    }

    function navigateSearch(direction) {
        if (searchMatches.length === 0) {
            return;
        }

        // Remove active highlight from current
        if (currentMatchIndex >= 0 && currentMatchIndex < searchMatches.length) {
            searchMatches[currentMatchIndex].classList.remove('active-highlight');
            searchMatches[currentMatchIndex].classList.add('highlight');
        }

        currentMatchIndex += direction;
        if (currentMatchIndex >= searchMatches.length) {
            currentMatchIndex = 0;
        }
        if (currentMatchIndex < 0) {
            currentMatchIndex = searchMatches.length - 1;
        }

        highlightCurrentMatch();
    }

    function highlightCurrentMatch() {
        if (currentMatchIndex < 0 || currentMatchIndex >= searchMatches.length) {
            return;
        }

        const match = searchMatches[currentMatchIndex];
        match.classList.remove('highlight');
        match.classList.add('active-highlight');

        // Expand parent nodes to make match visible
        expandParents(match);

        // Scroll into view
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });

        searchCount.textContent = (currentMatchIndex + 1) + '/' + searchMatches.length;
    }

    function expandParents(element) {
        let parent = element.parentElement;
        while (parent && parent !== treeContainer) {
            if (parent.classList.contains('tree-node-children') && parent.classList.contains('hidden')) {
                parent.classList.remove('hidden');
                const prevSibling = parent.previousElementSibling;
                if (prevSibling) {
                    const toggle = prevSibling.querySelector('.toggle');
                    if (toggle) {
                        toggle.classList.remove('collapsed');
                        toggle.classList.add('expanded');
                    }
                }
            }
            parent = parent.parentElement;
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
