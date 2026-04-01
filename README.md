# JSON Tree Viewer

A VS Code extension for JSON file visualization. Provides a visual tree view for browsing, searching, and querying JSON files using JSONata.

## Features

- 🌳 **Visual tree navigation** of JSON data with expand/collapse support
- 🔍 **Search** with next/previous match navigation
- 🔍 **Query and Transform** with JSONata expressions
- 🎯 **Copy Value** - Unescape JSON strings within JSON payload (Right Click + Copy Value)
- 📍 **Locate in File** - Right-click a tree node and jump to its location in the source editor
- 🔁 **JSON5 support** - View JSON5 files
- 🔁 **Auto-refresh** on file save
- 🌐 **Internationalization** - English, Chinese, Japanese

## Installation

### From VS Code Marketplace

Search for `tlcsdm-json-tree-view` in the VS Code Extensions panel.

### From VSIX File

1. Download the `.vsix` file from the [Releases](https://github.com/tlcsdm/vscode-json-tree-view/releases) page
2. In VS Code, go to Extensions → ··· → Install from VSIX

## Usage

### Open JSON Tree View

1. Open a JSON, JSONC, or JSON5 file in VS Code
2. Click the tree icon in the editor title bar, or:
   - Use keyboard shortcut `Ctrl+Shift+J` (`Cmd+Shift+J` on macOS)
   - Right-click in the editor → "Open JSON Tree View"
   - Right-click a JSON file in the Explorer → "Open JSON Tree View"
   - Run the command `JSON Tree View: Open JSON Tree View` from the Command Palette

### Search

Use the search bar at the bottom of the tree view to find content. Navigate between matches with the ↑/↓ buttons or Enter/Shift+Enter.

### JSONata Query

Enter a JSONata expression in the input field at the bottom to query and transform the JSON data.

For a comprehensive guide on JSONata expressions, see the [JSONata Expression Guide](docs/jsonata-guide.md).

> Note: VS Code Marketplace only has **Details** (README) and **Changelog** tabs. `docs/jsonata-guide.md` is included in the published extension package, but it cannot appear as a separate Marketplace tab.

### Copy Value

Right-click any node in the tree to copy its key or value (unescaped).

### Locate in File

Right-click any node in the tree and choose **Locate in File** to jump to that node in the JSON source editor.

## Keyboard Shortcuts

| Shortcut | Description |
|----------|-------------|
| `Ctrl+Shift+J` (`Cmd+Shift+J` on macOS) | Open JSON Tree View (when editing a JSON file) |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `tlcsdm.jsonTreeView.autoRefresh` | `true` | Automatically refresh the tree view when the JSON file is saved |

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Lint
npm run lint

# Package extension
npm run package

# Run tests
npm run test
```

## License

[MIT](LICENSE)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
