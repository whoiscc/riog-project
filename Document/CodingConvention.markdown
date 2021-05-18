First thing first: everything below comes from personal tastes.

### General

Do not use *significant* ES6 and later syntax, most importantly `class`. Some tiny syntax or life-saving things like
`const/let` and `for ... of ...` is permitted. Arrow lambda is something in between.

Use camel case for every name, including files and directories (maybe except constant magic numbers, but currently none
of them show up). Variables have lower initial letters, while most of the others including methods have upper ones.

Every file in the project should only contain ASCII characters.

No plural at all for names. Use `List` or `Dict` postfix when applicable.

### Game

The reference implementation of games is written in [CoffeeScript][coffee]. The following discuss the benefit of it.

**The unbroken *vanilla* requirement.** The translation of CoffeeScript code is quite different from any other
translation process. Each source file could be compiled alone, so no `import` and no searching path is involved.
Furthermore, in fact there is no configuration, only simple file watcher is set up in WebStore to execute a single-line
command upon updating. Even without it, all CoffeeScript files could be compiled as a whole with one manually-typed
command. Also, because CoffeeScript is designed to be translated line-by-line, the generated JavaScript files are not
deflating and are safe to be committed, which helps people to run the project without CoffeeScript compiler, e.g. GitHub
Pages. There is no additional polyfill needed, so in index.html, we only need to specify the same game names with `js`
extension name instead of `coffee`. This compromised minimal confusions. In conclusion, unlike ES6 or TypeScript, using
CoffeeScript in project (with WebStorm) only put negligible effect on vanilla, which is acceptable.

**A project for reading, not for directly using.** CoffeeScript is not famous, even not being used anymore. I am aware
of that. However, this also means that the language could be considered as relatively stable. There will be no new
feature expected to be introduced, and the compiler probably will not adapt any breaking change, so at any time in the
future someone could always grab the newest CoffeeScript compiler somewhere and start playing around in this project
smoothly. The CoffeeScript language is heavily inspired from Ruby, which makes it in some sense more suitable as
presented "pseudo" code instead of practical one. The syntax is quite flexible, so I could write the reference
implementation in the way that most easy to be read through and understood, not the way that most maintainable. In one
word, the distinguished purpose of this project from the more common ones makes CoffeeScript much more appealing for
this project than for the other ones.

**First-class literate programming support.** The CoffeeScript compiler has built-in support for
[literate programming][lit-program], which makes it unparalleled in programming-for-presenting case.

[coffee]: https://coffeescript.org/

[lit-program]: https://en.wikipedia.org/wiki/Literate_programming

With the reasons above, I chose to use CoffeeScript for the games. The following is for some other convention dedicated
for games.

In the implementation of game, the mutability and side effect of functions are deserved to be taken care of. Because of
this, the functions are divided into three groups (actually four, because some function could be in both the first two
groups):

* **Non-idempotent.** If the function is called with the same arguments and same system states more the once, the
  following calling mutates system states. The most common case is the functions that call context interfaces to modify
  canvas. Notice that calling context interfaces is not sufficient to determine a function is non-idempotent. Beside the
  obvious case that a function conditionally skip all logic in the following calls, for example, a function that loops
  until a call to `DequeueEvent` returns falsy value could be idempotent, because the following call to it will escape
  the loop immediately.
* **Non-deterministic.** If the function is called with the same arguments and same system states more the once, and
  each time the function may return different values or mutate system states differently upon each calling. The most
  common case is a function that generates random numbers.
* **Pure.** If a function is idempotent and deterministic.

As simple examples, among the standard interfaces, `Create` could be non-deterministic, `Redraw` could be (and probably
will be) non-idempotent, and `OnFrame` could be both non-idempotent and non-deterministic.

It is encouraged to write as much pure functions as possible. A function whose name starts with `Get` is indicated to be
pure. If a function is non-idempotent or non-deterministic, its name should be prefixed accordingly. TODO: decide the
prefix, an immature idea is use `NI$` for non-idempotent and `ND$` for non-deterministic. Any way, the dollar sign will
probably be used.