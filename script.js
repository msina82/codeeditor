require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

require(['vs/editor/editor.main'], function() {
    let editors = {};
    let currentTab = 'html';

    // Initialize Monaco Editors
    function createEditor(language, containerId, initialValue) {
        return monaco.editor.create(document.getElementById(containerId), {
            value: initialValue,
            language: language,
            theme: 'vs-dark',
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize: 14,
            padding: { top: 10 },
            scrollBeyondLastLine: false,
            roundedSelection: false,
            folding: true,
            formatOnType: true,
            formatOnPaste: true,
            lineNumbers: 'on',
            wordWrap: 'on'
        });
    }

    // Initialize editors with default values
    editors.html = createEditor('html', 'html-editor', 
        '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>'
    );

    editors.css = createEditor('css', 'css-editor',
        'body {\n    margin: 0;\n    padding: 20px;\n    font-family: Arial, sans-serif;\n}\n\nh1 {\n    color: #333;\n}'
    );

    editors.js = createEditor('javascript', 'js-editor',
        '// Your JavaScript code here\nconsole.log("Hello from JavaScript!");'
    );

    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const language = tab.dataset.tab;
            
            // Update active tab
            document.querySelector('.tab.active').classList.remove('active');
            tab.classList.add('active');

            // Update active editor
            document.querySelector('.editor.active').classList.remove('active');
            document.getElementById(`${language}-editor`).classList.add('active');

            currentTab = language;
            editors[language].focus();
        });
    });

    // Update preview
    function updatePreview() {
        const html = editors.html.getValue();
        const css = editors.css.getValue();
        const js = editors.js.getValue();

        const previewFrame = document.getElementById('preview-frame');
        const preview = previewFrame.contentDocument || previewFrame.contentWindow.document;

        preview.open();
        preview.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <style>${css}</style>
                </head>
                <body>
                    ${html}
                    <script>
                        // Console override
                        const console = {
                            log: function() {
                                window.parent.postMessage({
                                    type: 'console',
                                    method: 'log',
                                    args: Array.from(arguments)
                                }, '*');
                            },
                            error: function() {
                                window.parent.postMessage({
                                    type: 'console',
                                    method: 'error',
                                    args: Array.from(arguments)
                                }, '*');
                            },
                            warn: function() {
                                window.parent.postMessage({
                                    type: 'console',
                                    method: 'warn',
                                    args: Array.from(arguments)
                                }, '*');
                            }
                        };
                    </script>
                    <script>${js}</script>
                </body>
            </html>
        `);
        preview.close();
    }

    // Console handling
    window.addEventListener('message', function(event) {
        if (event.data.type === 'console') {
            const consoleOutput = document.getElementById('console-output');
            const logElement = document.createElement('div');
            logElement.classList.add('console-line');
            
            if (event.data.method === 'error') {
                logElement.classList.add('console-error');
            } else if (event.data.method === 'warn') {
                logElement.classList.add('console-warning');
            }

            logElement.textContent = event.data.args.join(' ');
            consoleOutput.appendChild(logElement);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });

    // Event Listeners
    document.getElementById('refresh-btn').addEventListener('click', updatePreview);
    document.getElementById('clear-console').addEventListener('click', () => {
        document.getElementById('console-output').innerHTML = '';
    });

    // Auto-update preview
    Object.values(editors).forEach(editor => {
        editor.onDidChangeModelContent(() => {
            updatePreview();
        });
    });

    // Initial preview
    updatePreview();
});
