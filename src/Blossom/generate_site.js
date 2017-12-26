'use stict';

var fs = require('fs');
var util = require('util');
var jquery = require('jquery');
const { JSDOM } = require("jsdom");

const config = require('./config');
var Post = require('./post');


if (!fs.existsSync('blog')) {
	fs.mkdirSync('blog');
}

var posts = [];
fs.readdirSync('content', 'utf8').forEach(filename => {
	var tokens = filename.replace(/_/g, ' ').replace(/.md/, '').split('-');
	posts.push(new Post(tokens[0], tokens[1], filename,
		fs.readFileSync('content/' + filename, 'utf8')));
});
posts.sort((a, b) => { return (a.getDate() >= b.getDate() ? -1 : 1) });

var base = fs.readFileSync('generator/index.html', 'utf8');
base = base.replace(/@{description}/, config.description)
	.replace(/@{author}/, config.author)
	.replace(/@{title}/, config.title)
	.replace(/@{brand}/, config.brand);

let options = { contentType: "text/html" };
const dom = new JSDOM(base, options);
var $ = jquery(dom.window);

function generatePostInfo(post) {
	return util.format('<li><a href="content/%s">%s</a>&nbsp;-&nbsp;%s</li>',
		post.getFileName(), post.getTitle(), post.getDate());
}

var archiveList = $('<ul>').attr({ 'id': 'archiveList' });
posts.forEach(post => {
	archiveList.append(generatePostInfo(post));
});

var latestPost = $('<ul>');
latestPost.append(generatePostInfo(posts[0]));

$('#postsList').append('<h3>' + config.heading + '</h3>')
	.append('<p>' + config.message + '</p>')
	.append('<hr>')
	.append('<h4>Latest Post</h4>')
	.append('<hr>')
	.append(latestPost)
	.append('<h4>Archive</h4>')
	.append('<hr>')
	.append(archiveList);

fs.writeFileSync('blog/index.html', dom.serialize());

if (!fs.existsSync('blog/content'))
	fs.mkdirSync('blog/content');

function generateContent(post) {
	var dom = new JSDOM(base, options);
	var $ = jquery(dom.window);

	$('#postsList').append($('<p class="post-date">').append(post.getDate()))
		.append(post.getContent());

	return dom.serialize();
}

posts.forEach(post => {
	fs.writeFileSync('blog/content/' + post.getFileName(), 
		generateContent(post), 'utf8');
});
