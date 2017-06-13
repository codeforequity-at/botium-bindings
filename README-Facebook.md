Testing your Facebook Chatbots
==============================
Here you find a quick introduction how to test your Facebook Chatbot with TestMyBot.

## What Facebook Messenger Platform features are supported ?
- [x] 1:1 conversations
- [x] Structured messages
- [ ] Webviews
- [ ] Payments

## Preparing your project

With [Jasmine](https://jasmine.github.io/), the setup looks like this:

    $ npm install testmybot --save-dev
    $ npm install jasmine --save-dev
    $ ./node_modules/.bin/jasmine init

Add a file named "testmybot.json" to your project directory. A very basic configuration for a [Facebook Chatbot](https://github.com/codeforequity-at/testmybot/tree/master/samples/facebook) looks like this:

    {
      "docker": {
        "container": {
          "testmybot-fbmock": {
	    "run": true
          }
        }
      }
    }

This tells TestMyBot to startup the Facebook mocker.

Add a file named "docker-compose.testmybot.override.yml" to your project directory. The sample from above contains a working example:

	version: "2"
	services:
	    testmybot-fbmock:
		environment:
		    TESTMYBOT_FACEBOOK_WEBHOOKPORT: 5000
		    TESTMYBOT_FACEBOOK_WEBHOOKPATH: "webhook"

This file tells TestMyBot where the Facebook Webhook is located. Most likely you have to adjust it to your own Chatbot project. 

Take the [Testmybot Jasmine Spec file](https://github.com/codeforequity-at/testmybot/blob/master/samples/facebook/spec/testmybot.spec.js) from the sample and place it into your project directory (spec/testmybot.spec.js).

In your package.json, define a script for TestMyBot names _start_testmybot_, which is run in the Docker container.

    ...
    "scripts": {
      "start_testmybot": "node index.js",
    },
    ...

You can hand over environment variables to your chatbot here. 

## Preparing your test cases

Now it's time to define your test cases. Please follow the guide in the section "How to Compose Test Cases" in the [project description](https://github.com/codeforequity-at/testmybot/blob/master/README.md#how-to-compose-test-cases).

## Running your test cases

And finally, run your tests with Jasmine:

    $ ./node_modules/.bin/jasmine

You will see some output from Docker, and in the end, your Jasmine tests should succeed (of course).






