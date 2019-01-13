Botium Bindings
===============

[![NPM](https://nodei.co/npm/botium-bindings.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-bindings/)

[ ![Codeship Status for codeforequity-at/botium-bindings](https://app.codeship.com/projects/077a7140-3175-0135-cee8-5eb28f78bdf5/status?branch=master)](https://app.codeship.com/projects/225703)
[![npm version](https://badge.fury.io/js/botium-bindings.svg)](https://badge.fury.io/js/botium-bindings)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

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

You should already have a Node.js project set up with the test runner of your choice (Mocha, Jasmine, Jest supported out of the box).

The following commands will install Botium Bindings, extend your Mocha specs with the Botium test case runner and run a sample Botium test:

```
> npm install -g botium-bindings
> botium-bindings init mocha
> npm install && npm run mocha
```

Here is what's happening:
* Your _package.json_ file is extended with a "botium"-Section and some devDependencies
* A _botium.json_ file is created in the root directory of your project
* A _botium.spec.js_ file is created in the "spec" folder to dynamically create test cases out of your Botium scripts
* A sample convo file is created in the "spec/convo" folder

Place your own Botium scripts in the "spec/convo" folder and Mocha will find them on the next run.

# Samples

There are a couple of [samples](samples) available, showing possible scenarios to use Botium Bindings. For all samples, use these commands to run them:

```
> npm install
> npm run test
```

To run the console emulator (text input and output), run this command in the sample directory:

```
> npm install
> npm run emulator
```

In case you want to see some more output, enable debug logging:

```
> export DEBUG=botium*
```

## Loading ready-to-use Chatbot Test Cases and Utterances from "Botium Utterances" library

[Link](samples/utterances)

* Demonstrates usage of the free utterances and chatbot test cases library ["Botium Utterances"](https://github.com/codeforequity-at/botium-utterances)
* Loads the typical "Tell me a Joke" test suite and runs it agains a Dialogflow chatbot

## Chatbot developed in Clojure

[Link](samples/clojure)

* Shows a chatbot developed in another programming language than Javascript
* Uses a chatbot developed with Clojure from the [Lemmings incubator](https://lemmings.io/)
* Downloads a docker image ("clojure.lein") and placing the chatbot in a docker container

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "botium-bindings-sample-clojure",
      "FACEBOOK_API": true,
      "FACEBOOK_WEBHOOK_PORT": 3000,
      "FACEBOOK_WEBHOOK_PATH": "webhook",
      "CLEANUPTEMPDIR": false,
	    "DOCKERIMAGE": "clojure:lein",
      "STARTCMD": "lein ring server-headless"
    },
    "Sources": {
      "GITURL": "https://github.com/lemmings-io/02-facebook-example.git"
    }
  }
}
```

## Connecting to Chatbot running in Facebook Messenger

[Link](samples/fbdirect)

* Can be used to automate testing of a chatbot already running in facebook messenger
* Usefull for regression testing, not for continuous testing (takes to much time to run)
* See sample directory for instructions

## Chatbot developed in PHP

[Link](samples/php)

* Chatbot developed in PHP
* See sample directory for instructions

## IBM Watson Chatbot

[Link](samples/watson)

* Connecting to Watson conversation service to run your convos
* Useful for regression testing
* Workspace can be copied automatically before running the test cases (to not pollute your workspace)

## Voice recognition and speech synthesis

[Link](samples/webspeechapi)

* Uses the Web speech api to run a conversation with Alexa
* Requires a *real* browser supporting the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
