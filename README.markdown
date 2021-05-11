# Reference Implementation of Games Project

> A place worth to look at before programming your first toy game.

This repository provides *[reference implementation][ref-impl]* (defined below) for 
several tiny games including:
- [ ] [2048][2048]
- [ ] [Tetris][tetris]
- [ ] [Snake][snake]
- [ ] [Breakout][breakout]
- [ ] [Flappy Bird][flappy-bird]
- [ ] [DaXiGua (Big Watermelon)][daxigua]
- [ ] [TiaoYiTiao (WeChat Jump)][tiaoyitiao]

[ref-impl]: https://en.wikipedia.org/wiki/Reference_implementation
[2048]: https://github.com/gabrielecirulli/2048
[tetris]: https://en.wikipedia.org/wiki/Tetris
[snake]: https://en.wikipedia.org/wiki/Snake_(video_game_genre)
[breakout]: https://en.wikipedia.org/wiki/Breakout_(video_game)
[flappy-bird]: https://en.wikipedia.org/wiki/Flappy_Bird
[daxigua]: https://github.com/liyupi/daxigua
[tiaoyitiao]: https://zh.wikipedia.org/wiki/%E8%B7%B3%E4%B8%80%E8%B7%B3

The game list may be extended with requirement for the added game:
* serverless
* in 2D or 3D which could be implemented with 2D engine
* could be implemented with 1000 or fewer lines of JavaScript code (no hard limit)
* playable on both desktop and mobile client (optional)

## Reference Implementation: what is it, and what's it for

The purpose of this project is easy: to create a practical, educational and fun
project. To be specific, the implementation should be:
* **minimal**: no extra functionality and no unnecessary error handling, even as few
  textures as possible to keep it a tiny implementation. It should take less than an
  hour for a programmer with basic JavaScript knowledge to somehow understand the
  logic of a game.
* **documented**: sufficient comments keep the code totally human-readable (even 
  written in JavaScript).
* **modular (standardized)**: each game is implemented in its own file, and exposes
  the same set of interfaces (document WIP) to the runtime. The decoupling of games 
  and runtime makes it easier to support more games and more platforms.
* **portable**: reference implementation should contain *almost* no 
  platform-dependent code. So that, the implementation could be generally referenced 
  or forked by many usages, even the ones not using JavaScript or targeting web
  platform.
* **vanilla**: no transpiler and packager should be introduced. Any unnecessary
  dependence will be minimally reimplemented, and the others (such as Konva) will
  be loaded from CDN. This helps a minimal development footprint. Intentionally it
  will hurt performance and portability (this is not the same as the portable above),
  so that no further effort will be wasted on making this implement 
  production-ready - it is never for that.
* **best-effort immutable**: the implementation should contain no global variable,
  should use as few mutable states as possible, and constrain the accessing to 
  mutable states to only unavoidable places. The functions should be *purified* if
  possible to keep them from mutable states. This helps reader to reason about the 
  implementation, and enables the possible that runtime pauses the game (and even
  save/restore its states) externally, completely transparently to the 
  implementation.
* **tested**: not fully meaningfully and useful for an application (so there will not
  be many testcases or high coverage rate), but provides a sense of security ^_^
  
## Todo List

* Reference implementation, for 2048 at least before anything below applies
* An *about* page includes the content of this readme
* Some test, CI and fancy budget for inducing customers
* Support more platforms (with alternative runtime implementation), possibly 
  including Electron, hybrid mobile application, Flutter, or even native desktop
  application through QuickJS
  - this doesn't mean that the whole codebase is cross-platform, just to prove that
    the implementation is modular and portable (see above)
* ...maybe more after next time waking up

> Appealing both inside and outside is achievable, let's see.
> 
> &mdash; <cite>whoiscc, 2021.5.11</cite>