Testing your Slack Chatbots
===========================
Here you find a quick introduction how to test your Slack Chatbot with TestMyBot.

## What Slack API features are supported ?

- [x] Authentication of your Bot over Oauth-Webhook
- [x] Contact your Bot at a private channel (#private)
- [x] Contact your Bot at a public channel (#general)
- [x] Direct mention your Bot in a message (@testmybot ...)
- [x] Slack Events API partly supported
- [x] Slack Web API partly supported
* chat.postMessage
* reactions.add
* channels.list
* im.open
* auth.test
* oauth.access
- [ ] Interactive Messages
- [ ] Incoming / Outgoing Webhooks
- [ ] Slack RTM
- [ ] Slash Commands

## Preparing your project

With [Jasmine](https://jasmine.github.io/), the setup looks like this:

    $ npm install testmybot --save-dev
    $ npm install jasmine --save-dev
    $ ./node_modules/.bin/jasmine init

Add a file named "testmybot.json" to your project directory. A very basic configuration for a [Slack Chatbot](https://github.com/codeforequity-at/botkit-starter-slack) looks like this:

    {
      "docker": {
        "container": {
          "testmybot-slackmock": {
            "run": true,
            "env": {
              "TESTMYBOT_SLACK_EVENTPORT": 3000,
              "TESTMYBOT_SLACK_EVENTPATH": "slack/receive",
              "TESTMYBOT_SLACK_OAUTHPORT": 3000,
              "TESTMYBOT_SLACK_OAUTHPATH": "oauth"
            }
          }
        }
      }
    }

Take the [Testmybot Jasmine Spec file](https://github.com/codeforequity-at/botkit-starter-slack/blob/master/spec/testmybot.spec.js) from the sample and place it into your project directory (spec/testmybot.spec.js).

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






