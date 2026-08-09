# Changelog

All notable changes to the "tlcsdm-json-tree-view" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Packaging error caused by TypeScript 7.x being incompatible with `typescript-eslint@8.x` peer dependency (`>=4.8.4 <6.1.0`); downgraded `typescript` to `~6.0.3` and removed the `postinstall` workaround script

## [1.0.1] - 2026-04-01

### Added

- Node location feature: right-click a node in the tree view and select "Locate in File" to jump to that node's position in the JSON source file
- Keyboard shortcut `Ctrl+Shift+J` (`Cmd+Shift+J` on macOS) to quickly open JSON Tree View
- Type-specific node icons with distinct colors for string (S), number (N), boolean (B), and null (∅) values
- JSONata Expression Guide documentation (`docs/jsonata-guide.md`)

## [1.0.0] - 2026-04-01

### Added

- Visual tree navigation of JSON data with expand/collapse support
- Search with next/previous match navigation
- JSONata query and transform support
- Copy value with JSON string unescaping (right-click context menu)
- JSON5 file support
- Auto-refresh on file save
- Editor title bar icon for quick access
- Right-click context menu in editor and file explorer
- Internationalization support (English, Chinese, Japanese)
