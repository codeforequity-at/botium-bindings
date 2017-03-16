Test My Bot
===========
TestMyBot is a test automation framework for your chatbot project. It is unopinionated and completely agnostic about any involved development tools. Best of all, it’s free and open source.

## Requirements
TestMyBot heavily relies on [Docker](https://www.docker.com/) to provide it’s outstanding capabilities in test automation. Your chatbot is fully transfered into a local docker container, the API mocks are possible by manipulating the DNS of the docker image. TestMyBot opens a channel to your Chatbot webhook and answers your Chatbots requests to the messenger API, providing everything to your test specs. 

Therefore, please install [Docker](https://www.docker.com/) first on your development machines. 

Of course, you need Node.js and npm installed and working.

Current Requirements on your Chatbot:
* Developed in Node.js (other languages supported, but with more configuration effort)
* Developed with Facebook Messenger Platform
* Facebook Webhook has to listen on all interfaces (listen to 0.0.0.0)
* Accept self-signed SSL certificates (for Node.js, NODE_TLS_REJECT_UNAUTHORIZED environment variable is set to 0 automatically by TestMyBot)
* Request verification has to be disabled (for Botkit: validate_requests should be set to false)

## Installation
Usually, you won't install this project on it's own, but you will include it in your Chatbot projects.

To install it to your chatbot project, type:

    $ npm install testmybot --save-dev
    $ npm install testmybot-fbmock --save-dev

Please note that you have to install it in your local development directory (not in global registry with -g).

## Quick Start

Please check out one of the samples to get a quick overview.

    $ git clone git clone https://github.com/codeforequity-at/testmybot-sample1.git
    $ cd testmybot-sample1
    $ npm install
    $ ./node_modules/.bin/jasmine

## Basic Usage

You can find some sample chatbot projects with rudimentary tests [here](https://github.com/codeforequity-at/testmybot-sample) and [here](https://github.com/codeforequity-at/testmybot-sample1). 

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

## Configuration

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

Please see _./node_modules/testmybot/testmybot.default.json_ for reference values.

## API

* testmybot.beforeAll(config) - builds Docker networking and containers from your configuration
 * config (optional) - you can pass an optional configuration argument (merged into other configuration)
 * returns a bluebird Promise
* testmybot.afterAll() - removes Docker networking and containers
 * returns a bluebird Promise
* testmybot.beforeEach() - starts Docker containers and waits until online
 * returns a bluebird Promise
* testmybot.afterEach() - stops Docker containers
 * returns a bluebird Promise
* testmybot.hears(msg, channelId) - send a text (or structured content) to your chatbot
 * msg - text or structured content
 * channelId (optional) - the channel to send your message to (in Facebook: "sender"/"recipient" or user profile id). You can mock parallel conversations with multiple users
* testmybot.says(channelId, timeoutMillis) - receive a text (or structured content) from your chatbot
 * channelId (optional) - receive for this channel (or user profile id)
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
          "channelId": 4440090943
      }

## Outlook

There is a long way to go for this library.

- [x] Support Facebook Chatbots
- [ ] Support Slack Chatbots
- [ ] Support Wechat Chatbots
- [x] Support Node.js Chatbots
- [ ] Support Microsoft Bot Framework Chatbots
- [ ] Support Python Chtabots
- [x] Define Test Cases with TestMyBot API calls
- [ ] Define Test Cases by conversation transcripts
- [ ] Run your Tests in _live environment_ with _real_ Endpoints



## License
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
