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

Add a file named "testmybot.json" to your project directory. A very basic configuration for a [Slack Chatbot](https://github.com/codeforequity-at/testmybot/tree/master/samples/slack) looks like this:

{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "testmybot-sample-slack",
      "SLACK_API": true,
      "SLACK_EVENT_PORT": 3000,
      "SLACK_EVENT_PATH": "slack/receive",
      "SLACK_OAUTH_PORT": 3000,
      "SLACK_OAUTH_PATH": "oauth",
      "CLEANUPTEMPDIR": false,
      "STARTCMD": "npm run start"
    },
    "Sources": {
      "GITURL": "https://github.com/howdyai/botkit-starter-slack",
      "GITPREPARECMD": "npm install"
    },
    "Envs": {
      "NODE_TLS_REJECT_UNAUTHORIZED": 0,
      "NODE_ENV": "dev",
      "DEBUG": "*",
      "PORT": "3000",
      "clientId": "159753246482.159685134291",
      "clientSecret": "b993ecebb034fe06bb05e2e31bc8f465"
    }
  }
}

Take the [Testmybot Jasmine Spec file](https://github.com/codeforequity-at/testmybot/blob/master/samples/slack/spec/testmybot.spec.js) from the sample and place it into your project directory (spec/testmybot.spec.js).

You can hand over environment variables to your chatbot here. 

## Preparing your test cases

Now it's time to define your test cases. Please follow the guide in the section "How to Compose Test Cases" in the [project description](https://github.com/codeforequity-at/testmybot/blob/master/README.md#how-to-compose-test-cases).

## Running your test cases

And finally, run your tests with Jasmine:

    $ ./node_modules/.bin/jasmine

In the end, your Jasmine tests should succeed (of course).






