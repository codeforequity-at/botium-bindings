# TestMyBot Sample: PHP Chatbot

The Chatbot used in this sample project is based on the [Chatbot PHP Boilerplate](https://github.com/christophrumpel/chatbot-php-boilerplate) project.

## Code Changes to the boilerplate code

There are some minor changes in code required:
* Point the file "debug.log" to "/tmp/debug.log", as the current directory usually isn't writeable
* Set some curl options (in src/FacebookSend.php) to allow connection to the TestMyBot Mocker

      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

## The Dockerfile to use

The default TestMyBot Dockerfile for the TestMyBot Docker container is using a Node.js-container. A Dockerfile for running a PHP application is easy to compose (Dockerfile.testmybot):

    FROM webdevops/php-nginx:7.1

    VOLUME /usr/src/app
    WORKDIR /usr/src/app

    CMD composer install && supervisord

The first line selects an official docker images with php and nginx. The last line first runs composer to install PHP dependencies and then starts the background processes (supervisord is included with the docker images from webdevops).

## The TestMyBot Configuration

In the TestMyBot configuration file (testmybot.json), the docker containers have to be initialized correctly:

    {
      "docker": {
        "container": {
          "testmybot-fbmock": {
            "run": true,
            "env": {
              "TESTMYBOT_FACEBOOK_WEBHOOKPORT": 80,
              "TESTMYBOT_FACEBOOK_WEBHOOKPATH": "index.php"
            }
          },
          "testmybot": {
            "dockerfile": "./Dockerfile.testmybot",
            "env": {
              "WEB_DOCUMENT_ROOT": "/usr/src/app"
            }				
          }			
        }
      }
    }

It points the TestMyBot Facebook Mocker to the URL the PHP Webhook is running (Port 80, path index.php), points to the PHP Dockerfile and sets the document root for nginx to the mounted project directory.

## Setting up TestMyBot

Now you can just initialize your project directory with testmybot and run the [Capture & Replay tools](https://github.com/codeforequity-at/testmybot#capture--replay-tools). 

    $ npm init
    $ npm install testmybot --save-dev
    $ npm install testmybot-chat --save-dev
    $ npm install jasmine --save-dev
    $ ./node_modules/.bin/jasmine init
    $ node ./node_modules/testmybot-chat/index.js
    $ ./node_modules/.bin/jasmine






