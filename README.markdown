# Reference Implementation of Games Project

This project makes the following contributions:

* Design a complete, consistent and comprehensive interface for reference implementation of games.
* Provide reference implementation for several games.
* Provide a reference implementation of RIoG-compatible engine.

To view and try this project, open it in WebStorm, and hit "Debug 'index.html'". The project is developed with Chrome
version 90.0.4430.212. It is also verified with Firefox version 78.10.1esr and Mi Browser (com.android.browser) version
14.4.18.

## Reference Implementation: what's it, and what's for

The reference implementation of a game, or a RIoG, is an implementation of the game that
following [a standard game interface][gi-doc]. You may check the document for detail, and the highlights of the
interface include:

* Decouple the game implementation with JavaScript runtime event loop. The implementation only requires a JavaScript
  interpreter (e.g. V8), but does not require a browser-like runtime.
* Abstract client details away from the game. The game implementation can be agnostic to canvas resolution, frame rate,
  etc. (It can also opt-in if it wants to.)
* Take good care about mutability. RIoG can be as "pure" as possible, and all non-idempotent or non-deterministic parts
  can be grouped and conspicuous, which helps a lot to make the implementation easy to reason about.
* The *feature tags* system and *context revision* system allow game implementation and game engine to describe what
  feature it requires/supports precisely. They also make the interface extensible.

[gi-doc]: Document/GameInterface.markdown

With these advantages, the standard game interface can serve as a perfect bridge between the reference implementation of
games and the game engines. The game engines that support to run RIoG are called RIoG-compatible engines. For game
developers, writing RIoGs will make their games runnable in all RIoG-compatible engines (which supports all feature tags
they require), which means benefits like cross-platform by free. For game engines, supporting the standard game
interface means all RIoGs can run on them, which is a perfect way to gain a fundamental game collection.

For now the standard game interface is most suitable for the games that:

* is serverless
* render in 2D

In the future, the game interface may be extended for more various types of games.

At first glance a RIoG may look similar to the ones that written with famous game frameworks, e.g. [Phaser][phaser]
and [Pixi][pixi]. However, this project is not a reinvention of them. The several major differences include:

* RIoG project is targeting more general games, from the ones that only requires basic animation (e.g. 2048) to the ones
  that leverage a realistic physic engine (e.g. cut the rope), even the ones that do not care about dynamical animation
  (e.g. a Ren'Py-like galgame engine that implemented as a reference implementation). So a RIoG is implemented on a
  lower level than the games with other game frameworks, and RIoG-compatible engines make less assumption about what
  game user tries to create.
* Because RIoG requires less high-level features, to implement a RIoG-compatible engine is much easier than adapt other
  game frameworks to another platform. Actually for most game frameworks there is only one implementation, so if the
  implementation does not support certain feature or platform, the games run on it have to accept it.
* RIoG project mainly focus on designing a good interface for RIoG, and only provides a proof-of-concept reference
  implementation of RIoG-compatible engine (see below). On the contrary, the game framework community may mainly focus
  on implementation and optimization. It may be a good idea to create a RIoG-compatible engine which works as an
  adapting layer to the game framework, so the user can benefit from both side. ^_^

[phaser]: https://phaser.io/

[pixi]: https://www.pixijs.com/

In this project, besides of the definition document for RIoG, the reference implementation of
[a list of games][gl-doc] and a reference implementation of RIoG-compatible engine are provided as well, which is called
RIoE. The engine is based on [Konva][konva], and along with a minimal runtime it can run RIoGs on the GitHub
Pages-hosted website. Notice that for the sake of simplicity, RIoE is intentionally incomplete and does not care about
platform compatibility, e.g. not including necessary polyfill for old browsers. The engine also omits bundling, which
hurts loading experience. So do not use RIoE directly for production, and consider using a more sophistic engine if your
game requires advanced features.

[gl-doc]: Document/GameList.markdown

[Konva]: https://konvajs.org/

## Reference Implementation as Example

The RIoGs provided by this project can serve as two purposes. The first is to be as testbed for the RIoG-compatible
engines. The implementation of engines should follow the behaviour of RIoE, and be free to make any extension with
custom feature tags.

The second goal is to serve as demonstration of how to implement the games. The provided RIoGs are written in
CoffeeScript, and the benefit of doing so is explained in the [coding convention document][cc-doc]. The implementation
is structured for reader-friendly, and most of them even use literate programming. The goal is to make the
implementation understandable to beginners, who is not familiar with how to write a game or not familiar with
JavaScript. The born nature of clarity of RIoG also helps to achieve the goal.

[cc-doc]: Document/CodingConvention.markdown

## Todo List

One major task that currently not on the list is to implement RIoG-compatible engines. According to my imagination the
most interesting ones should be:

* Based on Flutter and running on mobile devices natively
* Based on SDL, with QuickJS as JavaScript interpreter, and running on Windows, Linux and macOS natively

Feel free to write your own RIoG-compatible engine! Any implementation that could run all games from this repository
will be listed in the front of this README.

----

* ~~Design the interface between runtime and game, and write document~~ (5.14)
* ~~Reference implementation of RIoG-compatible engine~~ (5.17)
* First RIoG, the 2048 game
* Add save/load function to runtime
* Add an about page to menu UI
* Add some tests for RIoG, so I can add badges to this README
* Publish the project to everyone

> Appealing both inside and outside is achievable, let's see.
>
> &mdash; <cite>whoiscc, 2021.5.11</cite>