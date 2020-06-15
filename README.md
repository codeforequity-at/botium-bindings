Botium Bindings
===============

[![NPM](https://nodei.co/npm/botium-bindings.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-bindings/)

[ ![Codeship Status for codeforequity-at/botium-bindings](https://app.codeship.com/projects/077a7140-3175-0135-cee8-5eb28f78bdf5/status?branch=master)](https://app.codeship.com/projects/225703)
[![npm version](https://badge.fury.io/js/botium-bindings.svg)](https://badge.fury.io/js/botium-bindings)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

**UPDATE 2020/06/15:** As Chatbots grow in importance, automated testing solutions will remain critical for ensuring that Chatbots actually do what their designers intend. We've been busy working on a product that allows testers to have visual insights and deeper understanding in their Chatbot's performance, offering several solutions to boost their interaction!
[Botium Coach will be introduced to the market as part of our online event on the 24th of June.](https://www.botium.ai/coach/)

[![](http://img.youtube.com/vi/WsNaDfZ7WHk/0.jpg)](http://www.youtube.com/watch?v=WsNaDfZ7WHk "Botium Coach is coming on 24th of June")

__This project was formerly known as "TestMyBot" - same scope, different name__

Botium is the Selenium for chatbots. Botium Bindings is the glue to bind Botium to test runners like Mocha, Jasmine and Jest.

# How do I get help ?
* Read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) series
* If you think you found a bug in Botium, please use the Github issue tracker.
* The documentation on a very technical level can be found in the [Botium Wiki](https://github.com/codeforequity-at/botium-core/wiki).
* For asking questions please use Stackoverflow - we are monitoring and answering questions there.
* For our VIP users, there is also a Slack workspace available (coming soon).

# Usage

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles ? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

You should already have a Node.js project set up with the test runner of your choice (Mocha, Jasmine, Jest supported out of the box). For mocha, you can do it like this:

```
> cd my-project-dir
> npm init -y
> npm install --save-dev mocha
```

The following commands will install Botium Bindings, extend your Mocha specs with the Botium test case runner and run a sample Botium test:

```
> cd my-project-dir
> npm install --save-dev botium-bindings
> npx botium-bindings init mocha
> npm install && npm run mocha
```

Here is what's happening:
* Your _package.json_ file is extended with a "botium"-Section and some devDependencies
* A _botium.json_ file is created in the root directory of your project
* A _botium.spec.js_ file is created in the "spec" folder to dynamically create test cases out of your Botium scripts
* A sample convo file is created in the "spec/convo" folder

Place your own Botium scripts in the "spec/convo" folder and Mocha will find them on the next run.

# Samples

You can find samples in the repositories for the various [Botium Connectors](https://botium.atlassian.net/wiki/spaces/BOTIUM/pages/360553/Botium+Connectors)
