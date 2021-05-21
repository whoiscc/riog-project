First thing first: everything below comes from personal tastes.

## General

Do not use *significant* ES6 and later syntax, most importantly `class`. Some tiny syntax or life-saving things like
`const/let` and `for ... of ...` is permitted. Arrow lambda is something in between.

Use camel case for every name, including files and directories. Most variable names and object keys have lower initial
letter, except the ones whose value is callable. Every other names use upper initial letter. Constant config names are
prefixed with `$`.

Every file in the project should only contain ASCII characters.

No plural at all for names. Use `List` or `Dict` postfix when applicable.

## Game

The RIoGs are written in [CoffeeScript][coffee]. The format of code is optimized for reading, not maintainable
(although for most languages the two goals are mostly interleaved, it is not the case for CoffeeScript, or Ruby, if you
are more familiar with and will get the point). In general the top-down structuring is preferred, but not compulsory.

[coffee]: https://coffeescript.org/

It is encouraged to write as much pure functions as possible, and the non-idempotent and non-deterministic properties
must be reflected from functions' names. These properties are described in [game interface document][gi-doc]. A function
whose name starts with `Get` is indicated to be pure. A function whose name starts with `Create` or `Update`
indicates it is a simple grouping of several calls to context's `Create` or `Update` function (only for junkrat), thus
it must be non-idempotent and deterministic.

[gi-doc]: GameInterface.markdown