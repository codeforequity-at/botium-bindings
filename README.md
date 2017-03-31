Test My Bot
===========

[![NPM](https://nodei.co/npm/testmybot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/testmybot/)

[![npm version](https://badge.fury.io/js/testmybot.svg)](https://badge.fury.io/js/testmybot)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()

TestMyBot is a test automation framework for your chatbot project. It is unopinionated and completely agnostic about any involved development tools. Best of all, it’s free and open source.

Your test cases are recorded by Capture & Replay tools and can be run against your Chatbot implementation automatically over and over again. It is meant to be included in your continuous integration pipeline, just as with your unit tests.

## Blog Articles

Here are links to some articles about TestMyBot:

[Capture & Replay: Bringing Chatbot Code Quality To a New Level](https://chatbotsmagazine.com/capture-replay-bringing-chatbot-code-quality-to-a-new-level-c0312971311a)

[Continuous Automated Testing for Your Chatbot With Open Source Tool “TestMyBot”](https://chatbotsmagazine.com/continuous-automated-testing-for-your-chatbot-with-open-source-tool-testmybot-53fd3757764e)

[No More Excuse: Automated Testing of your Chatbot with “TestMyBot”](https://chatbotsmagazine.com/no-more-excuse-automated-testing-of-your-chatbot-with-testmybot-3c1ed98dd043)

## How does it work ?
The key (and only) concept of this framework is to simulate ("mock out") the "real" Chatbot APIs (like the Facebook Messenger Platform API), hijacking them through docker networks. Your chatbot is transfered into a local docker container, the API mocks are possible by manipulating the DNS of the docker image. For example, any access to "graph.facebook.com" is redirected to another local docker container simulating the Facebook Messenger Platform API. 

TestMyBot injects your Chatbots behaviour into the test runner, and your test case specifications into your Chatbot. 

TestMyBot heavily relies on [Docker](https://www.docker.com/) to provide it’s outstanding capabilities in test automation.  

### Showcase: Your Chatbot as Node.js application with Facebook Messenger Platform API
In "normal" operation mode, your Chatbot connects to the Facebook Messenger Platform API at http://graph.facebook.com and receives Callbacks from there on a [registered webhook](https://developers.facebook.com/docs/messenger-platform) - similar for Slack oder other platforms. So the architecture in the most simple scenario looks like this:

![Architecture without Docker](docs/architecture_nodocker.png)

### Showcase: TestMyBot is running automated tests on your Chatbot

When TestMyBot runs your Chatbot, it won't connect to the real Chatbot API, but it won't notice. It runs within a docker container providing a network seperated from the physical network. TestMyBot simulates Facebook Messenger Platform API and runs your test cases on it.

![Architecture with Docker](docs/architecture_withdocker.png)

## Requirements

Please install [Docker](https://www.docker.com/) first on your development machines. 

Of course, you need Node.js and npm installed and working.

Current Requirements on your Chatbot:
* Developed in Node.js (other languages supported, but with more configuration effort)
* Developed with Facebook Messenger Platform or Slack API
* Webhook has to listen on all interfaces (listen to 0.0.0.0)
* Accept self-signed SSL certificates (for Node.js, NODE_TLS_REJECT_UNAUTHORIZED environment variable is set to 0 automatically by TestMyBot)
* Request verification has to be disabled (for Botkit: validate_requests should be set to false)

### Special considerations for Facebook Messenger Platform
* Only 1:1 conversations supported
* Structured messages supported

### Special considerations for Slack API
* Private channel (#private) and public channel (#general) supported
* Direct mention of your bot with @testmybot
* Only Web API and Events API supported
* No Slash commands, no RTM API

## Installation
Usually, you won't install this project on it's own, but you will include it in your Chatbot projects.

To install it to your chatbot project, type:

    $ npm install testmybot --save-dev
    $ npm install testmybot-fbmock --save-dev
    $ npm install testmybot-slackmock --save-dev

Please note that you have to install it in your local development directory (not in global registry with -g).

## Quick Start

Please check out one of the samples to get a quick overview.

    $ git clone https://github.com/codeforequity-at/testmybot-sample1.git
    $ cd testmybot-sample1
    $ npm install
    $ ./node_modules/.bin/jasmine
    
* [Botkit Facebook Sample](https://github.com/codeforequity-at/testmybot-sample)
* [Custom Facebook Sample](https://github.com/codeforequity-at/testmybot-sample1)
* [Botkit Slack Sample](https://github.com/codeforequity-at/botkit-starter-slack)

Basic Usage
===========

You can find some sample chatbot projects with rudimentary tests [here](https://github.com/codeforequity-at/botkit-starter-facebook) and [here](https://github.com/codeforequity-at/testmybot-sample1). 

With [Jasmine](https://jasmine.github.io/), the setup looks like this:

    $ npm install testmybot --save-dev
    $ npm install testmybot-fbmock --save-dev
    $ npm install jasmine --save-dev
    $ ./node_modules/.bin/jasmine init
	
Add a file named "testmybot.json" to your project directory. A very basic configuration, which is always required:

    {
      "docker": {
        "container": {
          "testmybot-fbmock": {
	    "run": true,
            "env": {
              "TESTMYBOT_FACEBOOK_WEBHOOKPORT": 5000,
              "TESTMYBOT_FACEBOOK_WEBHOOKPATH": "webhook"
            }
          }
        }
      }
    }

You tell TestMyBot that the Facebook Webhook of your chatbot runs on port 5000, and the url path is /webhook. You don't have to tell the hostname, because it will run in a docker container with a fixed hostname ("testmybot").  

Add a file spec/testmybot.spec.js with a basic test case:

    describe('TestMyBot Sample Conversation Test Suite', function() {
      var bot = require('testmybot');

      beforeAll(function(done) {
        bot.beforeAll().then(done);
      }, 120000);

      beforeEach(function(done) {
        bot.beforeEach().then(done);
      }, 60000);

      afterEach(function(done) {
        bot.afterEach().then(done);
      }, 60000);

      afterAll(function(done) {
        bot.afterAll().then(done);
      }, 60000);

      it('should answer to hello', function(done) {

        bot.hears('hello');

        bot.says().then((msg) => {
          expect(msg.messageText).toMatch(/echo/);
          done();
        }).catch((err) => {
          throw new Error(err);
        });
      });

      it('should send a generic payload', function(done) {

        bot.hears('Generic');

        bot.says().then((msg) => {
          expect(msg.message.attachment.type).toEqual('template');
          expect(msg.message.attachment.payload.template_type).toEqual('generic');
          done();
        }).catch((err) => {
          throw new Error(err);
        });
      });
    });

Take special care for:
* All test are asynchronous
* Setup and Teardown has high timeouts, because buildling, running and stopping Docker containers can take some time. Especially on first run, it will take very long. Afterwards, the Docker cache speeds up things.
* TestMyBot uses [Bluebird](http://bluebirdjs.com) Promises
* The test API is rather simple
 * bot.hears: send a text (or structured content) to your chatbot
 * bot.says: receive a text (or structured content) from your chatbot

In your package.json, define a script for TestMyBot names _start_testmybot_, which is run in the Docker container.

    ...
    "scripts": {
      "start_testmybot": "node index.js",
    },
    ...

You can hand over environment variables to your chatbot here. 
And finally, run your tests with Jasmine:

    $ ./node_modules/.bin/jasmine init

You will see some output from Docker, and in the end, your Jasmine tests should succeed (of course).

How to Compose Test Cases
=========================
As is it very hard to compose your test cases from a combination of bot.hears / bot.says instructions to the test runner, TestMyBot is able to run your test cases from previously recorded conversations. The conversations are loaded from simple text files. The conversation files should be included in your project and added to your source code control, just as with other test specs (usually to folder ./spec/convo/*.convo.txt).

## Convo Files
We made a strong decision to not use any standard file format like JSON or XML for writing the test cases, as they should be kept extremly simple. It should be so simple that everyone could compose the conversation files manually. Here is an example for a simple test conversation:

    Call Me Captain
    A simple Test Case 

    #me
    hello

    #bot
    Try: `what is my name` or `structured` or `call me captain`

    #me
    call me captain

    #bot
    Got it. I will call you captain from now on.

    #me
    who am i

    #bot
    Your name is captain

The semantics are simple:
* The first line is the name of the test case
* The second line up to the first line starting with # is an optional description text
* A line starting with #me will send the following text to your Chatbot
  * Anything following will be the channel to send to - for example: #me #private will send the message to the private channel (Slack only)
* A line starting with #bot will expect your Chatbot to answer accordingly
  * Anything following will be the channel to listen to - for example: #bot #general will wait for a message on the #general-channel (Slack only)
  
That's it. 

## Structured Messages
Actually, for sending structured messages, you can include the message content in this conversation files as well:

    #bot
    {
        "message": {
            "attachment": {
                "type": "template",
                "payload": {
                    ....
                }
            }
        }
    }

    #me
    {
        "postback": {
            "payload": "White T-Shirt"
        }
    }


## Capture & Replay Tools
Especially with structured messages, it can become uncomfortable to write those conversation files manually. TestMyBot contains two tools to support you with writing your conversation files:

### TestMyBot IDE
The TestMyBot IDE provides a simple browser interface to record and organize your test cases, and to interact with your Chatbot.

![TestMyBot IDE](docs/screenshots/ide_demo.png)

Installation and running it is simple:

    $ npm install testmybot-ide --save-dev
    $ node ./node_modules/testmybot-ide/ide.js

It will show all test cases from the ./spec/convo/-Folder and will write new conversations to this directory as well.

[More Information](testmybot-ide)

### TestMyBot Chat
The TestMyBot Chat is a basic command line interface to your Chatbot running within TestMyBot. You can record and save your conversation files.

![TestMyBot Chat](docs/screenshots/chat.png)

Installation and running it is simple:

    $ npm install testmybot-chat --save-dev
    $ node ./node_modules/testmybot-chat/index.js

[More Information](testmybot-chat)

## Running the conversation files

You have to advice the TestMyBot library within your test specification how to add test cases to your test runner. In the following example, you advice it to add the test cases to Jasmine:

    describe('TestMyBot Sample Conversation Test Suite', function() {
        var bot = require('testmybot');

        ... setup / teardown code
        
        bot.setupTestSuite(
            (testcaseName, testcaseFunction) => {
              it(testcaseName, testcaseFunction, 60000);
            },
            (response, tomatch) => {
              expect(response).toContain(tomatch);
            },
            (err) => fail(err)
        )        
    });

You have to provide the callback functions for:
* adding a test case to your test suite. TestMyBot provides the name of the test case and the function to call.
* comparing your bot responses with the actual responses. You can choose your matcher here (regexp, contains, ...)
* failing the test case because the bot doesn't respond (or other failures)

So TestMyBot is agnostic about the actual test runner you are using. The example above can be adapted to other test runners easily.

Configuration
=============

There are three steps for buildling the configuration:
* ./node_modules/testmybot/testmybot.default.json
* ./testmybot.default
* "config" Parameter to "beforeAll" method

The subsequent steps are overwriting the configuration parameters from the previous steps. The .json-files are converted into a plain object in Node.js. Here are some settings which you may have to adapt in your environment (but in most cases, the defaults will work fine).

Parameter  | Default Value | Description
------------- | ------------- | -------------
testendpoint  | http://127.0.0.1:46199 | The TestMyBot Facebook Mocker is running on this endpoint. For older Docker installations on Windows or Mac OS (running with docker-machine), you have to change the IP to match the IP address of the Docker VM (_$docker-machine ip default_)
defaultsaytimeout  | 5000 | Timeout (in milliseconds) for the says-method to wait for your chatbot to answer
docker.dockerpath | "docker" | Path to your Docker executable
docker.container.testmybot | | Docker configuration for the container which will run your chatbot. If your chatbot is not running on Node.js you can define another Dockerfile and Dockerdir here (see _./node_modules/testmybot/testmybot.default.json_ as a reference)
docker.container.testmybot-fbmock | | Docker configuration for the TestMyBot Facebook Mocker
docker.container.testmybot-fbmock.env | | Environment variables for the Docker container. You have to adapt TESTMYBOT_FACEBOOK_WEBHOOKPORT and TESTMYBOT_FACEBOOK_WEBHOOKPATH here (see Basic Usage section) to match your chatbot.
docker.container.testmybot-slackmock | | Docker configuration for the TestMyBot Slack Mocker
docker.container.testmybot-slackmock.env | | Environment variables for the Docker container. You have to adapt TESTMYBOT_SLACK_EVENTPORT, TESTMYBOT_SLACK_EVENTPATH, TESTMYBOT_SLACK_OAUTHPORT and TESTMYBOT_SLACK_OAUTHPATH here (see Basic Usage section) to match your chatbot.

Please see _./node_modules/testmybot/testmybot.default.json_ for reference values.

API
===
* testmybot.beforeAll(config) - builds Docker networking and containers from your configuration
  * config (optional) - you can pass an optional configuration argument (merged into other configuration)
  * returns a bluebird Promise
* testmybot.afterAll() - removes Docker networking and containers
  * returns a bluebird Promise
* testmybot.beforeEach() - starts Docker containers and waits until online
  * returns a bluebird Promise
* testmybot.afterEach() - stops Docker containers
  * returns a bluebird Promise
* testmybot.hears(msg, from, channel) - send a text (or structured content) to your chatbot
  * msg - text or structured content
  * from - sender of the message
  * channel (optional) - the channel to send your message to (Slack only). You can mock parallel conversations with multiple users
* testmybot.says(channel, timeoutMillis) - receive a text (or structured content) from your chatbot
  * channel (optional) - receive for this channel (Slack only)
  * timeoutMillis (optional) - timeout when not receiving anything (default: 5000)
  * returns a bluebird Promise, which resolves to the the received message. 
 
Here is an example for a received message. It contains (for brevity) the message text (if applicable), the full original message (in "orig") and the message body (in "message). For structured messages, there is no messageText.

      {
          "orig": {
              "recipient": {
                "id":4440090943
              },
            "message": { 
                "text": "Text received, echo: hello"
            }
          },
          "messageText": "Text received, echo: hello",
          "message": {
              "text": "Text received, echo: hello"
          },
          "channel": "#private"
      }

Outlook
=======
Work is ongoing

- [x] Support Facebook Chatbots
- [x] Support Slack Chatbots
- [ ] Support Wechat Chatbots
- [x] Support Node.js Chatbots
- [ ] Support Microsoft Bot Framework Chatbots
- [ ] Support Python Chtabots
- [x] Define Test Cases with TestMyBot API calls
- [x] Define Test Cases by conversation transcripts
- [ ] Run your Tests in _live environment_ with _real_ Endpoints



License
=======
MIT License

Copyright (c) 2017 Code For Equity

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
