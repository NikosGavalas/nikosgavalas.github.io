'use stict';

var fs = require('fs');
var jquery = require('jquery');

const { JSDOM } = require("jsdom");

const config = require('./config');


if (!fs.existsSync('blog')) {
	fs.mkdirSync('blog');
}

var cont = fs.readFileSync('generator/index.html', 'utf8');
cont = cont.replace(/@{description}/, config.description)
	.replace(/@{author}/, config.author)
	.replace(/@{title}/, config.title)
	.replace(/@{brand}/, config.brand);

let options = { contentType: "text/html" };
const dom = new JSDOM(cont, options);
var $ = jquery(dom.window);

$('#postsList').append('<h3>' + config.heading + '</h3>')
	.append('<p>' + config.message + '</p>')
	.append('<hr>')
	.append('<h4>Latest Post</h4>')
	.append('<hr>')
	.append('latestPostList')
	.append('<h4>Archive</h4>')
	.append('<hr>')
	.append('archiveList');

fs.writeFileSync('blog/index.html', dom.serialize());
