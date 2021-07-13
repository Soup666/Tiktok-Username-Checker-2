const request = require('request');
const readline = require("readline");
const colors = require('colors');
const chalk = require('chalk');
const ProxyAgent = require('proxy-agent');
const prompt = require('prompt-sync')({sigint: true});
const UserAgent = require(`user-agents`);
const fs = require('fs');
const http = require('https');
const proxies = fs.readFileSync('./extra/proxies.txt', 'utf-8').replace(/\r/gi, '').split('\n');
const config = require("./extra/config.json");
const validURL = require("valid-url");
const validPath = require("path-validation");

//process.on('uncaughtException', e => {});
//process.on('uncaughtRejection', e => {});
//process.warn = () => {};

var usernames = [...new Set(fs.readFileSync('usernames.txt', 'utf-8').replace(/\r/g, '').split('\n'))];
var available = 0;
var unavailable = 0;
var rate = 0;
var retries = 0;
var checked = 0;

const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest);

    const request = http.get(url, (response) => {
        // check if response is success
        if (response.statusCode !== 200) {
            return cb('Response status was ' + response.statusCode);
        }

        response.pipe(file);
    });

    // close() is async, call cb after close completes
    file.on('finish', () => file.close(cb));

    // check for request error too
    request.on('error', (err) => {
        fs.unlink(dest);
        return cb(err.message);
    });

    file.on('error', (err) => { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result) 
        return cb(err.message);
    });
};

function write(content, file) {
    fs.appendFile(file, content, function(err) {});
}

function menu(options, numbered, title) {
    console.log(`\x1Bc`);
    process.title = "Tiktok Checker"; 
    if (title) {
        printAsciiLogo();
    }
    else {
        console.log(`
                    ${chalk.hex("552586")('╔╦╗┬┬┌─┌┬┐┌─┐┬┌─  ╔═╗┬ ┬┌─┐┌─┐┬┌─┌─┐┬─┐')}
                    ${chalk.hex("804FB3")(' ║ │├┴┐ │ │ │├┴┐  ║  ├─┤├┤ │  ├┴┐├┤ ├┬┘')}
                    ${chalk.underline.hex("B589D6")(' ╩ ┴┴ ┴ ┴ └─┘┴ ┴  ╚═╝┴ ┴└─┘└─┘┴ ┴└─┘┴└─')}
        `);
    }
    
    options.forEach(function(item, index, array) {
        console.log("[%s] %s", numbered ? chalk.white(index+1) : "*", chalk.hex("DDA0DD")(item));
    })
    console.log("")
    return prompt(chalk.hex("65727A")("prompt: "));
}

function pcheck(username) {
    var userAgent = new UserAgent();
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    var agent = new ProxyAgent(`${config.proxyType}://` + proxy);
    request({
        method: "HEAD",
        url: `https://www.tiktok.com/@${username}`,
        agent,
        headers: { 
            'User-Agent': userAgent.toString(),
            "accept-encoding": "gzip, deflate, br",
            'accept-language': 'en-US',
            'content-type': 'application/json'
        }
    }, (err, res, body) => {
        if(!res){ pcheck(username); }
        else{
            switch(res.statusCode){
                case 200: 
                        unavailable++;
                        console.log(chalk.red(`[${chalk.white('%s')}] (%s/%s/%s) [${chalk.white('Unavailable')}] Username: %s | Proxy: %s`), res.statusCode, available, checked, usernames.length, username, proxy);
                        write(username + "\n", "usernames/unavailable.txt");
                        
                        break; 
                case 404: 
                        available++;
                        console.log(chalk.green(`[${chalk.white('%s')}] (%s/%s/%s) [${chalk.white('Available')}] Username: %s | Proxy: %s`), res.statusCode, available, checked, usernames.length, username, proxy);
                        write(username + "\n", "usernames/available.txt");
                        break; 
                case 429: 
                        rate++;
                        console.log(chalk.red("[${chalk.white('%s')}] (%s) Proxy: %s has been rate limited".inverse), res.statusCode, rate, proxy);
                        pcheck(username);
                        break; 
                default: 
                        pcheck(username)
                        break; 
            }
        }
        checked = available + unavailable;
        process.title = `[313][Tiktok Usernames Checker] - ${checked}/${usernames.length} Total Checked | ${available} Available | ${unavailable} Unavailable | ${rate} Rate Limited | Retries ${retries}`;
    });
} 

function check(username) {
    var userAgent = new UserAgent();
    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    request({
        method: "HEAD",
        url: `https://www.tiktok.com/@${username}`,
        headers: { 
            'User-Agent': userAgent.toString(),
            "accept-encoding": "gzip, deflate, br",
            'accept-language': 'en-US',
            'content-type': 'application/json'
        }
    }, (err, res, body) => {
        if (res && res.statusCode === 200) {
            unavailable++;
            console.log(chalk.red(`[${chalk.white('%s')}] (%s/%s/%s) [${chalk.white('Unavailable')}] Username: %s `), res.statusCode, available, checked, usernames.length, username);
            write(username + "\n", "usernames/unavailable.txt");
        } else if (res && res.statusCode === 404) {
            available++;
            console.log(chalk.green(`[${chalk.white('%s')}] (%s/%s/%s) [${chalk.white('Available')}] Username: %s `), res.statusCode, available, checked, usernames.length, username);
            write(username + "\n", "usernames/available.txt");

        } else if (res && res.statusCode === 429) {
            rate++;
            console.log(chalk.red(`[%s] (%s) you have been rate limited (${chalk.white('consider using a VPN while using proxyless!')})`.inverse), res.statusCode, rate);
            check(username);
        } else {
            check(username)
        }

        checked = available + unavailable;
        process.title = `[313][Tiktok Usernames Checker] - ${checked}/${usernames.length} Total Checked | ${available} Available | ${unavailable} Unavailable | ${rate} Rate Limited`;
    });
}

function Generate(dict, Size, Loops) {
    let Name = '';
    for (var i = 0; i < Size; i++) {
        Name = Name + dict.charAt(Math.floor(Math.random() * dict.length));
    }
    console.log(Name);
    write(Name + "\n", "./extra/Generated.txt");
}

function printAsciiLogo() {
    console.log(chalk.hex("EE1D52")(`
    ▄▄▄█████▓ ██▓ ██ ▄█▀▄▄▄█████▓ ▒█████   ██ ▄█▀    ▄████▄   ██░ ██ ▓█████  ▄████▄   ██ ▄█▀▓█████  ██▀███  
    ▓  ██▒ ▓▒▓██▒ ██▄█▒ ▓  ██▒ ▓▒▒██▒  ██▒ ██▄█▒    ▒██▀ ▀█  ▓██░ ██▒▓█   ▀ ▒██▀ ▀█   ██▄█▒ ▓█   ▀ ▓██ ▒ ██▒
    ▒ ▓██░ ▒░▒██▒▓███▄░ ▒ ▓██░ ▒░▒██░  ██▒▓███▄░    ▒▓█    ▄ ▒██▀▀██░▒███   ▒▓█    ▄ ▓███▄░ ▒███   ▓██ ░▄█ ▒
    ░ ▓██▓ ░ ░██░▓██ █▄ ░ ▓██▓ ░ ▒██   ██░▓██ █▄    ▒▓▓▄ ▄██▒░▓█ ░██ ▒▓█  ▄ ▒▓▓▄ ▄██▒▓██ █▄ ▒▓█  ▄ ▒██▀▀█▄  
      ▒██▒ ░ ░██░▒██▒ █▄  ▒██▒ ░ ░ ████▓▒░▒██▒ █▄   ▒ ▓███▀ ░░▓█▒░██▓░▒████▒▒ ▓███▀ ░▒██▒ █▄░▒████▒░██▓ ▒██▒
    ▒ ░░   ░▓  ▒ ▒▒ ▓▒  ▒ ░░   ░ ▒░▒░▒░ ▒ ▒▒ ▓▒   ░ ░▒ ▒  ░ ▒ ░░▒░▒░░ ▒░ ░░ ░▒ ▒  ░▒ ▒▒ ▓▒░░ ▒░ ░░ ▒▓ ░▒▓░
        ░     ▒ ░░ ░▒ ▒░    ░      ░ ▒ ▒░ ░ ░▒ ▒░     ░  ▒    ▒ ░▒░ ░ ░ ░  ░  ░  ▒   ░ ░▒ ▒░ ░ ░  ░  ░▒ ░ ▒░
    ░       ▒ ░░ ░░ ░   ░      ░ ░ ░ ▒  ░ ░░ ░    ░         ░  ░░ ░   ░   ░        ░ ░░ ░    ░     ░░   ░ 
            ░  ░  ░                ░ ░  ░  ░      ░ ░       ░  ░  ░   ░  ░░ ░      ░  ░      ░  ░   ░     
                                                `));
    console.log("");
    process.title = `[313] [Tiktok Usernames Checker] Created By Luci and Forked by Soup666`;
    console.log(`[${chalk.green('!')}] Tiktok Checker | Created by ${chalk.bold.red('Luci')} and Forked by ${chalk.bold.red('Soup666')} | Join! discord.gg/XKv5AEPKZu for support!`);
    console.log(chalk.red(`[${chalk.white('!')}] Some Usernames may be banned and will show as Available!`));
}

var options = menu(['Proxied Checking', 'Proxyless Checker (Proxies)', 'Username Generator', 'Use Wordlist (URL/File)'], true, true);

switch (options) {
    case "1":
        console.log(`[Proxy] ${config.proxyType}`);
        console.log(`[Tiktok Username Checker]: Started!`.inverse);
        console.log(`[Checking %s Usernames with %s Proxies!]`.inverse, usernames.length, proxies.length);
        for (var i in usernames) pcheck(usernames[i]);
        break;

    case "2":
        console.log(`[Tiktok Username Checker]: Started!`.inverse);
        console.log(`[Checking %s Usernames with No Proxies!]`.inverse, usernames.length, );
        for (var i in usernames) check(usernames[i]);
        break;
    case "3":
        var Size = menu(['How many chars for each Username!'], false);
        var Loops = menu(['How many would you like to generate!'], false);
        var Letters = menu(['Dictionary Type | AlphaNumerical | abcdefghijklmnopqrstuvwxyz0123456789', 'Dictionary Type | Alphabet | abcdefghijklmnopqrstuvwxyz'], true);
        switch (Letters) {
            case "1":
                var dict = "abcdefghijklmnopqrstuvwxyz0123456789";
                for (var i = 0; i < Loops; i++) {
                    Generate(dict, Size, Loops);
                }
                break;
            case "2":
                var dict = "abcdefghijklmnopqrstuvwxyz";
                for (var i = 0; i < Loops; i++) {
                    Generate(dict, Size, Loops);
                }
                console.log("[!] Usernames Generated Successfully! Check Generated.txt in The Extra Folder!"); 
                break;
        }
        break;
    case "4":
        usernames = null;

        var Wordlist = menu(['Enter URL / Filepath!'], false)
        if (validURL.isUri(Wordlist)) {
            console.log("[-] Selecting URL");
            console.log("[*] Writing to ./extra/wordlist.txt");

            download(Wordlist, "./extra/wordlist.txt", function onComplete(error) {
                if (error) console.log(error);
            });

            console.log("[*] Downloaded file!");
            usernames = [...new Set(fs.readFileSync('./extra/wordlist.txt', 'utf-8').replace(/\r/g, '').split('\n'))];
        } else {
            console.log("[-] Selecting Filepath");

            var system = (validPath.isAbsoluteWindowsPath(Wordlist) ? "Windows" : (validPath.isAbsoluteLinuxPath(Wordlist) ? "Linux" : "Error"))

            if (system == "Error") {
                console.log("[!] Incorrect Filepath");
                return;
            }
            console.log("[*] Valid for %s", system);
            if (fs.existsSync(Wordlist)) {
                console.log("[*] File exists");
                usernames = [...new Set(fs.readFileSync(Wordlist, 'utf-8').replace(/\r/g, '').split('\n'))];
            }
            else {
                console.log("[!] File doesn't exist!");
            }
            
        }

        if (usernames == null) {
            console.log("[!] Something went wrong... Aborting");
            return;
        }

        var proxy = menu(['Proxied Checking', 'Proxyless Checker (Proxies)'], true);
        switch (proxy) {
            case "1":
                console.log(`[Proxy] ${config.proxyType}`);
                console.log(`[Tiktok Username Checker]: Started!`.inverse);
                console.log(`[Checking %s Usernames with %s Proxies!]`.inverse, usernames.length, proxies.length);
                for (var i in usernames) pcheck(usernames[i]);
                break;
            case "2":
                console.log(`[Tiktok Username Checker]: Started!`.inverse);
                console.log(`[Checking %s Usernames with No Proxies!]`.inverse, usernames.length, );
                for (var i in usernames) check(usernames[i]);
                break;
        }
        console.log("[*] Exited successfully");
        break;
    default:
            console.log(`[!] ${chalk.hex("DDA0DD")("Unknown option:")} ` + options);
            break;
}