# Changelog

All notable changes to the "tlcsdm-json-tree-view" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Build error: `typescript-eslint@8.x` does not support TypeScript 7 directly; adopted the TypeScript team's recommended side-by-side setup — `typescript` is aliased to `npm:@typescript/typescript6@^6.0.2` (providing the TS6 API for `typescript-eslint`) while `@typescript/native` is aliased to `npm:typescript@^7.0.2` (providing the `tsc` binary for type-checking at TS7 speed)

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
