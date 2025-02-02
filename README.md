# Ruby Builder

This repo means to aid hosting of compiled Ruby for a specific environment. This repo exists because currently nobody updating RVM compiled binaries.

## Compiling Binaries

Clone this project and run `make all`. The compiled rubies will be inside `public` dir.

To use the compiled rubies, extract it to `~/.rvm/rubies` and run `rvm alias create default <version>`.

```sh
tar -xzf ruby-3.4.1.tar.gz -C ~/.rvm/rubies
rvm alias create default ruby-3.4.1
```
