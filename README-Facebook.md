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
	  "botium": {
	    "Capabilities": {
	      "PROJECTNAME": "testmybot-sample1",
	      "FACEBOOK_API": true,
	      "FACEBOOK_WEBHOOK_PORT": 5000,
	      "FACEBOOK_WEBHOOK_PATH": "webhook",
	      "CLEANUPTEMPDIR": false,
	      "STARTCMD": "node index.js"
	    },
	    "Envs": {
	      "NODE_TLS_REJECT_UNAUTHORIZED": 0,
	      "NODE_ENV": "dev"
	    }
	  }
	}


Take the [Testmybot Jasmine Spec file](https://github.com/codeforequity-at/testmybot/blob/master/samples/facebook/spec/testmybot.spec.js) from the sample and place it into your project directory (spec/testmybot.spec.js).

You can hand over environment variables to your chatbot here. 

## Preparing your test cases

Now it's time to define your test cases. Please follow the guide in the section "How to Compose Test Cases" in the [project description](https://github.com/codeforequity-at/testmybot/blob/master/README.md#how-to-compose-test-cases).

## Running your test cases

And finally, run your tests with Jasmine:

    $ ./node_modules/.bin/jasmine

In the end, your Jasmine tests should succeed (of course).

## Debugging

In case of troubles, you can activate debug before starting your test cases:

	$ export DEBUG=botium*
