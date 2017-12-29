'use stict';

var fs = require('fs');
var jquery = require('jquery');
const { JSDOM } = require("jsdom");
var JSDOM_options = { contentType: "text/html" };

const config = require('./config');
var Post = require('./post');



/* Create an array of all the posts */
var posts = [];

/* Populate it */
if (!fs.existsSync('content')) {
	console.log('Please create a directory "content" with your markdown files first.');
	process.exit(1);
}

function createDir(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
}

createDir('blog');

fs.readdirSync('content', 'utf8').forEach(filename => {
	var isMd = /^.+\.md$/;

	if (isMd.test(filename)) {
		var tokens = filename.replace(/_/g, ' ').replace(/.md/, '').split('-');
	
		posts.push(new Post(tokens[0], tokens[1], filename,
			fs.readFileSync('content/' + filename, 'utf8')));
	}
});

/* Sort them based on date */
posts.sort((a, b) => { return (a.getDate() >= b.getDate() ? -1 : 1) });

function backgroundColor() {
	let col = config.navbar.background_color;
	return col == '' ||
		col == ' ' ||
		col == 'bg-dark' ?
		'bg-dark' : '" style="background-color: ' + col + '; "';
}

var base = fs.readFileSync('base.html', 'utf8');
base = base.replace(/@{description}/, config.meta.description)
	.replace(/@{author}/, config.meta.author)
	.replace(/@{keywords}/, config.meta.keywords)
	.replace(/@{title}/, config.site.title)
	.replace(/@{brand}/, config.navbar.brand)
	.replace(/@{theme}/g, config.navbar.theme)
	.replace(/@{background-color}/, backgroundColor());


function loadImage(imageFileName) {
	fs.copyFileSync('content/' + imageFileName, 'blog/content/' + imageFileName);
}

function generateBlogHomeHTML(posts) {
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

	$('#main').append($('<h3>').text(config.blog.heading))
		.append($('<p>').text(config.blog.message))
		.append('<hr>')
		.append($('<h4>').text('Latest Post'))
		.append('<hr>')
		.append(latestPost)
		.append($('<h4>').text('Archive'))
		.append('<hr>')
		.append(archiveList);

	fs.writeFileSync('blog/blog.html', dom.serialize());

	return;
}

generateBlogHomeHTML(posts);

function generateIndexHTML () {
	const dom = new JSDOM(base, JSDOM_options);
	var $ = jquery(dom.window);

	// $('#main').append

	fs.writeFileSync('blog/index.html', dom.serialize());	
}

generateIndexHTML();

createDir('blog/content');

function generateContentHTML(post) {
	const dom = new JSDOM(base, JSDOM_options);	
	var $ = jquery(dom.window);

	$('#main').append($('<p>').addClass('post-date')
		.append(post.getDate()))
		.append(post.getContent());

	$('img').each((index, element) => {
		var neededImg = $(element).attr('src');
		loadImage(neededImg);
	}); 

	return dom.serialize();
}

posts.forEach(post => {
	fs.writeFileSync('blog/content/' + post.getFileName(),
		generateContentHTML(post), 'utf8');
});
