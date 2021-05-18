# Reference Implementation of Games Project

> A place worth to look at before programming your first toy game.

This repository provides *[reference implementation][ref-impl]* (defined below) for several tiny games including:

- [ ] [2048][2048]
- [ ] [Tetris][tetris]
- [ ] [Snake][snake]
- [ ] [Breakout][breakout]
- [ ] [Flappy Bird][flappy-bird]
- [ ] [DaXiGua (Big Watermelon)][daxigua]
- [ ] [TiaoYiTiao (WeChat Jump)][tiaoyitiao]
- [ ] [Chrome Dino][chrome-dino]
- [ ] [Notepad][notepad]
- [ ] [Windows Calculator][windows-calculator]
- [ ] [Ren'Py][renpy] (probably embed JavaScript instead of Python)

[ref-impl]: https://en.wikipedia.org/wiki/Reference_implementation

[2048]: https://github.com/gabrielecirulli/2048

[tetris]: https://en.wikipedia.org/wiki/Tetris

[snake]: https://en.wikipedia.org/wiki/Snake_(video_game_genre)

[breakout]: https://en.wikipedia.org/wiki/Breakout_(video_game)

[flappy-bird]: https://en.wikipedia.org/wiki/Flappy_Bird

[daxigua]: https://github.com/liyupi/daxigua

[tiaoyitiao]: https://zh.wikipedia.org/wiki/%E8%B7%B3%E4%B8%80%E8%B7%B3

[chrome-dino]: https://en.wikipedia.org/wiki/Dinosaur_Game

[notepad]: https://en.wikipedia.org/wiki/Microsoft_Notepad

[windows-calculator]: https://en.wikipedia.org/wiki/Windows_Calculator

[renpy]: https://www.renpy.org/

The game list may be extended with requirement for the added game:

* serverless
* in 2D or 3D which could be implemented with 2D engine
* could be implemented with 1000 or fewer lines of JavaScript code (no hard limit)
* playable on both desktop and mobile client (optional)

The repository also includes several runtime (which also could be considered as reference implementation) for running
the games, backed with:

- [ ] [Konva][konva]
- [ ] Some yet-to-be-decided WebGL library
- [ ] [Skia][skia] (probably through [Flutter][flutter])

[konva]: https://konvajs.org/

[skia]: https://skia.org/

[flutter]: https://flutter.dev/

It is recommended to view and develop this project with WebStorm, and helpful project files are committed as well. To
run the project, select *Debug 'index.html'* from menu. Currently, generated JavaScript files are committed, however, it
will be better if a CoffeeScript compiler could be used by file watcher.

The project is developed with Chrome version 90.0.4430.212. It is also verified with Firefox version 78.10.1esr and Mi
Browser (com.android.browser) version 14.4.18.

<!-- todo: explain runtime not production-ready, so not good for fork & add custom
game prototype, and expect it to work. welcome pr -->

## Reference Implementation: what's it, and what's for

The purpose of this project is simple: to create a practical, educational and fun project. To be specific, the
implementation should be:

* **minimal**: no extra functionality and no unnecessary error handling, even as few textures as possible to keep it a
  tiny implementation. It should take less than an hour for a programmer with basic JavaScript knowledge (or even only
  know languages other than JavaScript) to somehow understand the logic of a game. This is the reason behind why I did
  not simply adapt to Phaser, because that is a lot to learn for beginners, and also why I design the game interface in
  a synchronized style which seems strange in JavaScript world, because I don't want the people who have not touched
  async lost themselves in these unrelated details.
* **documented**: sufficient comments keep the code totally human-readable (even written in JavaScript).
* **modular (standardized)**: each game is implemented in its own file, and exposes the same set of
  interfaces ([document][gi-doc]) to the runtime. The decoupling of games and runtime makes it easier to support more
  games and more platforms.
* **portable**: reference implementation should contain *almost* no platform-dependent code. So that, the implementation
  could be generally referenced or forked by many usages, even the ones not using JavaScript or the ones not targeting
  web platform.
    - The *portable* here is only in the sense of clean code (e.g. no conditional branches based on platform detection),
      which is not related to actually run the code in different clients. See *runnable* and *vanilla* below.
* **proof-of-concept runnable**: each game should be functional if the executing environment could fulfill certain
  requirement, and it's fine if the game cannot run in other cases and is disabled. The goal here is to proved that the
  implementation is not pseudocode, and no more.
* **vanilla**: no transpiler and packager should be introduced. Any unnecessary dependence will be minimally
  reimplemented, and the others (such as Konva) will be loaded from CDN. This helps a minimal development footprint.
  Intentionally it will hurt performance and portability, so that no further effort will be wasted on making this
  implementation production-ready &mdash; the project is never for that.
    - The reference implementation is decided to be written in CoffeeScript. The discussion of rational is
      in [coding convention document][cc-doc-game].
* **best-effort immutable**: the implementation should contain no global variable, should use as few mutable states as
  possible, and constrain the accessing to mutable states to only unavoidable occurrences. The functions should be *
  purified*
  if possible to keep them from mutable states. This helps reader to reason about the implementation, and enables the
  possible that runtime pauses the game (and even save/restore its states) externally, which is completely transparent
  regards to the implementation.
* **extensible**: although *minimal* is important, it is not acceptable if the simplification hurts the ability of
  extending the game back into a full version. To be specific, all design stubs for a full game should be there (e.g. in
  breakout, the interface to make implementing bonus brick and bomb brick possible), only the actual implementing is
  omitted.
* **tested**: not fully meaningfully and useful for an application (so there will not be many testcases or high coverage
  rate), but provides a sense of security ^_^

[gi-doc]: Document/GameInterface.markdown

[cc-doc-game]: Document/CodingConvention.markdown#game

## Todo List

* ~~Design the interface between runtime and game, document it somewhere~~ (5.14)
* ~~A working runtime based on Konva~~ (5.17)
* Reference implementation, for 2048 at least before anything below applies
* An *about* page includes the content of this readme
* Some test, CI and fancy budget for inducing customers
* Support more platforms (with alternative runtime implementation), possibly including Electron, hybrid mobile
  application, Flutter, or even native desktop application through QuickJS
    - this doesn't mean that the whole codebase is cross-platform, just to prove that the implementation is modular and
      portable (see above)
* ...maybe more after next time waking up

> Appealing both inside and outside is achievable, let's see.
>
> &mdash; <cite>whoiscc, 2021.5.11</cite>