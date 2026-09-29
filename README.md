# Browser Homepage

A simple start page with a daily to-do list, a homework tracker, and a deadline countdown. It switches to a dark theme from 7pm to 7am on its own.

No build step or dependencies. Everything is saved in your browser's `localStorage`.

## Features
- **Today**: tasks with a small progress bar. Tasks stay until you delete them with the × button.
- **Homework**: assignments with an optional subject tag and a progress bar. Use "Clear completed" to remove finished ones.
- **Deadline**: one deadline with a live countdown. It turns amber when less than 24 hours are left, red under 3 hours, and shows "Past due" once it has passed.

## Export / import
Click **Export / Import** on the homework card. It shows your homework and deadline as plain text that you can copy or download as a `.txt` file. To import, paste or open text and press **Import**:

```
Deadline: 2026-10-02 23:59 — All homework

Homework:
[ ] Essay (English)
[x] Worksheet
```

- `[x]` means done and `[ ]` means not done. A subject goes in parentheses at the end of the line.
- Plain lines under `Homework:` are added as unfinished assignments.
- `Deadline: none` clears the deadline.
- Import replaces your homework list and deadline with what's in the text. If the text leaves one of them out, that one stays as it was.

## Use it as your homepage
Copy the full path to `index.html`, for example
`file:///C:/Users/<you>/Desktop/github/browser-homepage/index.html`

- **Chrome / Edge**: Settings → On startup → *Open a specific page* → add the path. To show it on the Home button too: Settings → Appearance → *Show home button* → enter the path.
- **Firefox**: Settings → Home → *Homepage and new windows* → *Custom URLs* → paste the path.

Browsers don't let a local file replace the **new tab** page without an extension. If you want that, a "custom new tab URL" extension can point new tabs at this file.
