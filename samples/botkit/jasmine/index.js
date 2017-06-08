if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

var runner = require('./bot')(process.env.page_token, process.env.verify_token);

runner.controller.setupWebserver(process.env.PORT || 3000, function(err, webserver) {
    runner.controller.createWebhookEndpoints(webserver, runner.bot, function() {
        console.log('ONLINE!');
    });
});
