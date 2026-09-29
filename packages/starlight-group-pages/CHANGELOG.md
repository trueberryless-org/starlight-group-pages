# starlight-group-pages

## 0.2.0

### Minor Changes

- [#45](https://github.com/trueberryless-org/starlight-group-pages/pull/45) [`748d9b9`](https://github.com/trueberryless-org/starlight-group-pages/commit/748d9b9afcf00b6d6f25c4db663b0375d0601c8f) Thanks [@trueberryless-bot](https://github.com/trueberryless-bot)! - Adds a `<GroupPageCards>` component to render the link cards of a directory on any page, e.g. `<GroupPageCards directory="guides" />`.
  
  Group pages now only omit the link to the group page itself from their link cards, so the component also lists the current page when used on a page of the listed directory.

### Patch Changes

- [#45](https://github.com/trueberryless-org/starlight-group-pages/pull/45) [`748d9b9`](https://github.com/trueberryless-org/starlight-group-pages/commit/748d9b9afcf00b6d6f25c4db663b0375d0601c8f) Thanks [@trueberryless-bot](https://github.com/trueberryless-bot)! - Fixes sidebar groups opened by clicking their label with the `sidebarLink: 'label'` option collapsing again when navigating to a page outside of the group.

## 0.1.1

### Patch Changes

- [#40](https://github.com/trueberryless-org/starlight-group-pages/pull/40) [`ac0eb3a`](https://github.com/trueberryless-org/starlight-group-pages/commit/ac0eb3a4cc5b83954ff16c891a7cde56a0e82eeb) Thanks [@trueberryless](https://github.com/trueberryless)! - Separates clickable sidebar group labels from their collapse toggle when using `sidebarLink: "label"`. The label and the toggle now have their own hover and focus backgrounds, making it clearer that they trigger different actions.

- [#40](https://github.com/trueberryless-org/starlight-group-pages/pull/40) [`ac0eb3a`](https://github.com/trueberryless-org/starlight-group-pages/commit/ac0eb3a4cc5b83954ff16c891a7cde56a0e82eeb) Thanks [@trueberryless](https://github.com/trueberryless)! - Fixes an issue where the collapse toggle of the current sidebar group could be invisible when using a theme that changes how the current sidebar link is styled.

## 0.1.0

### Minor Changes

- [#30](https://github.com/trueberryless-org/starlight-group-pages/pull/30) [`3aaf60d`](https://github.com/trueberryless-org/starlight-group-pages/commit/3aaf60d78d219138662fd0e0a40c933eeb612ca4) Thanks [@trueberryless-bot](https://github.com/trueberryless-bot)! - Initial public release: gives every sidebar group a page listing its content as link cards, generated for directories without an index page and appended to existing index pages, and links it from the sidebar group, either as an “Overview” item or through a clickable group label.
