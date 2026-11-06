# Browser Homepage

A simple start page with a daily to-do list, a homework tracker, and a deadline countdown. It switches to a dark theme from 7pm to 7am on its own.

No build step or dependencies. Everything is saved in your browser's `localStorage`.

## Features
- **Today**: tasks with a small progress bar. Tasks stay until you delete them with the × button.
- **Homework**: assignments with an optional subject tag and a progress bar. Use "Clear completed" to remove finished ones.
- **XP, levels and gems**: checking off a to-do gives 10 XP, and checking off homework gives 25 XP. Each item gives XP only once, so unchecking it and checking it again gives nothing. Level 2 takes 100 XP, and each level after that needs 50 XP more than the one before. Every level-up gives 10 💎, and every 5th level gives 50 💎.
- **More (⋯)**: the ⋯ button under the cards shows or hides an extra section. It holds **Math practice** and **Study**.
- **Math practice**:
  - 66 topics, from integers and fractions up through trigonometry (law of sines/cosines, unit circle, and more). Questions are randomly generated.
  - Pick one topic, or press **Review all** to get a mix of every type.
  - A wrong answer or **I don't know** adds the topic to **Needs practice**. Get it right 3 times in a row to clear it, or remove it with ×. **Practice these** quizzes you only on that list.
  - Answers can be typed like `3/4`, `1 1/2`, `2√3` or `2sqrt(3)`, `5pi/6`, `(x+2)(x-3)`, `x >= 4`, or `4.5 x 10^6`. If the value is right but the form isn't (for example an unsimplified fraction), it asks you to fix it and doesn't count it as wrong.
  - **Main goals** give you something to work toward. Each of the 8 topic groups is a goal, and the panel at the top shows your current one. Get a topic right 3 times in a row (across sessions) to make it solid, and make every topic in a group solid to finish that goal and earn 20 XP per topic. Press a goal's name to switch to it, and **Work on this goal** to get questions only from its unfinished topics. Solid topics stay solid, even if you miss them later.
  - **Today** is a daily target of 10 right answers, worth 30 XP. Reaching it on consecutive days builds a 🔥 day streak.
  - After each answer, the explanation plays one step at a time. Use **Show all** to skip ahead or **↻ Replay** to watch it again. This also applies to Study.
- **Study: Geometry**: timed practice with a mastery score for each of 58 question types, such as surface area of cones or arc length.
  - Tick the question types you want, one at a time, by group, or with **Select all** / **Select none**. Then press **Start practicing** to get random questions from those types. You can change the ticks during a session.
  - **Review** works on just 3 ticked types that aren't mastered yet, easiest first (a shorter goal time counts as easier). Types you last got wrong are chosen first. Each type lasts until you get 3 right in a row, or moves on after 6 questions.
  - **Assessment** tests you on up to 20 ticked types, one question each, taking turns between groups and favoring types you've practiced least. It shows nothing about your answers until the end, then gives a score by group and an explanation for each miss. Pressing **End** early reports what you answered. Answers count toward mastery, and the report goes away when you start another session.
  - Each question is timed. The timer pauses while the tab is hidden or the ⋯ section is closed.
  - A wrong answer or **I don't know** scores 0. A right answer scores 70%, plus up to 30% for speed: the full 30% at or under the type's goal time, falling to nothing at 3× the goal.
  - Mastery combines your last 10 attempts at that type, with recent ones counting most. Attempts you haven't made yet count as 0, so it takes 10 fast right answers to reach 100%. A right answer with no speed bonus tops out at 70%.
- **Effects**: Math practice and Study have sound and animation on everything you do, from typing to finishing a session. Right answers in a row build a 🔥 streak that raises the pitch of the chime and makes the confetti bigger, with fireworks at every 10. In Study, a green bar shows the time left to beat the goal, and fast answers and new mastery (90% or more) get their own celebration. The 🔊 button on either card turns sound on or off. If your system is set to reduce motion, the animations are skipped and the sounds stay.
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
