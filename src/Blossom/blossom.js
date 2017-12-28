'use stict';

var fs = require('fs');
var jquery = require('jquery');
const { JSDOM } = require("jsdom");
var JSDOM_options = { contentType: "text/html" };

const config = require('./config');
var Post = require('./post');


if (!fs.existsSync('blog')) {
	fs.mkdirSync('blog');
}

/* Create an array of all the posts */
var posts = [];

/* Populate it */
if (!fs.existsSync('content')) {
	console.log('Please create a directory "content" with your markdown files first.');
	process.exit(1);
}

var hasAbout = false;
fs.readdirSync('content', 'utf8').forEach(filename => {
	if (filename === 'about.html') {
		// TODO posts.push(new Post(filename, '', filename, ...))
		hasAbout = true;
	}

	var tokens = filename.replace(/_/g, ' ').replace(/.md/, '').split('-');

	posts.push(new Post(tokens[0], tokens[1], filename,
		fs.readFileSync('content/' + filename, 'utf8')));
});

/* Sort them based on date */
posts.sort((a, b) => { return (a.getDate() >= b.getDate() ? -1 : 1) });

var base = fs.readFileSync('base.html', 'utf8');
base = base.replace(/@{description}/, config.description)
	.replace(/@{author}/, config.author)
	.replace(/@{title}/, config.title)
	.replace(/@{brand}/, config.brand)
	.replace(/@{keywords}/, config.keywords);


function generateIndexHTML(posts) {
	const dom = new JSDOM(base, JSDOM_options);
	var $ = jquery(dom.window);

	var archiveList = $('<ul>').attr('id', 'archiveList');

	posts.forEach(post => {
		archiveList.append(
			$('<li>').append(
				$('<a>').attr('href', 'content/' + post.getFileName()).text(post.getTitle())
			).append(' - ' + post.getDate())
		);
	});

	var latestPost = $('<ul>').append(archiveList.children().first().clone());

	$('#main').append($('<h3>').text(config.heading))
		.append($('<p>').text(config.message))
		.append('<hr>')
		.append($('<h4>').text('Latest Post'))
		.append('<hr>')
		.append(latestPost)
		.append($('<h4>').text('Archive'))
		.append('<hr>')
		.append(archiveList);

	fs.writeFileSync('blog/index.html', dom.serialize());

	return;
}

generateIndexHTML(posts);


if (!fs.existsSync('blog/content'))
	fs.mkdirSync('blog/content');

function generateContentHTML(post) {
	const dom = new JSDOM(base, JSDOM_options);	
	var $ = jquery(dom.window);

	$('#main').append($('<p>').addClass('post-date')
		.append(post.getDate()))
		.append(post.getContent());

	return dom.serialize();
}

posts.forEach(post => {
	fs.writeFileSync('blog/content/' + post.getFileName(),
		generateContentHTML(post), 'utf8');
});
