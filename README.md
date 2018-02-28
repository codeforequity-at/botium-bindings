Test My Bot
===========

[![NPM](https://nodei.co/npm/testmybot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/testmybot/)

[ ![Codeship Status for codeforequity-at/testmybot](https://app.codeship.com/projects/077a7140-3175-0135-cee8-5eb28f78bdf5/status?branch=master)](https://app.codeship.com/projects/225703)
[![npm version](https://badge.fury.io/js/testmybot.svg)](https://badge.fury.io/js/testmybot)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

TestMyBot is a test automation library for chatbots. Test cases are recorded by Capture & Replay tools and can be run against your chatbot implementation automatically over and over again. It is meant to be included in your continuous integration pipeline, just as with your unit tests.

#Documentation

Please navigate to our [Wiki](https://github.com/codeforequity-at/testmybot/wiki) for documentation.

#Samples

There are a couple of [samples](samples) available, showing possible scenarios to use TestMyBot. For all samples, you these commands to run them:

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
> export DEBUG=testmybot*,botium*
```

## Chatbot developed with Microsoft Bot Framework

[Link](samples/botframework)

* Uses one of the sample chatbots included in the [Bot Framework Samples Repository](https://github.com/Microsoft/BotBuilder-Samples)
* Loads chatbot code from Github automatically
* Uses "docker" mode to place chatbot in docker container

## Chatbot developed with Botkit

[Link](samples/botkit/jasmine)

* Wires Botkit with TestMyBot

## Loading a Facebook chatbot from Git

[Link](samples/calculator)

* Uses a [calculator sample](https://github.com/codeforequity-at/testmybot-sample-calculator)
* Loads chatbot code from Github automatically
* Uses "docker" mode to place chatbot in docker container

(no test cases contained in this sample)

## Chatbot developed in Clojure

[Link](samples/clojure)

* Shows a chatbot developed in another programming language than TestMyBot
* Uses a chatbot developed with Clojure from the [Lemmings incubator](https://lemmings.io/)
* Downloads a docker image ("clojure.lein") and placing the chatbot in a docker container

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "testmybot-sample-clojure",
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






