const prompt = require('prompt-sync')({sigint: true});
const chalk = require('chalk');

function menu(options, identifier) {

    console.log("")
    options.forEach(function(item, index, array) {
        console.log(("[%s] ", index+1), item);
    })
    console.log("")

    return prompt(chalk.hex("Test: "));
}

var options = menu(['Proxied Checking', 'Proxyless Checker (Proxies)', 'Username Generator', 'Use Wordlist (URL/File)'], options);
console.log("Option: %s", options);
