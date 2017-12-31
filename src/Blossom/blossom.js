'use stict';

var fs = require('fs');

var jquery = require('jquery');
const { JSDOM } = require("jsdom");
var JSDOM_options = { contentType: "text/html" };

var crypto = require('crypto');
var md5 = crypto.createHash('md5');

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
		col == ' ' ?
		'bg-' + config.navbar.theme : '" style="background-color: ' + col + '; "';
}

var base = fs.readFileSync('base.html', 'utf8');
base = base.replace(/@{description}/, config.meta.description)
	.replace(/@{author}/, config.meta.author)
	.replace(/@{keywords}/, config.meta.keywords)
	.replace(/@{title}/, config.site.title)
	.replace(/@{favicon}/, config.site.favicon)
	.replace(/@{brand}/, config.navbar.brand)
	.replace(/@{theme}/g, config.navbar.theme)
	.replace(/@{background-color}/, backgroundColor());

	
function loadImage(imageFileName) {
	var src = 'content/' + imageFileName;
	var dst = 'blog/content/' + imageFileName;

	if (!fs.existsSync(dst))
		fs.copyFileSync(src, dst);
}

loadImage(config.site.favicon);

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

function addSocialIcon($, icon, value) {
	$('#social-list').append(
		$('<li>').addClass('list-inline-item').append(
			$('<a>').addClass('social fa fa-' + icon).attr('href', value)
		)
	)
	return;
}

function calculateGravatarHash(email) {
	email = email.replace(/ /g, '').toLowerCase();

	var ret = md5.update(email).digest('hex').toString();
	console.log(ret);
	return ret;
}

function getAvatar() {

	if (config.home.avatar.source != "") {
		loadImage(config.home.avatar.source);
	}

	return config.home.avatar.source == "" ?
		'https://www.gravatar.com/avatar/' + calculateGravatarHash(config.social.email) :
		'./content/' + config.home.avatar.source;
}

function generateIndexHTML() {
	const dom = new JSDOM(base, JSDOM_options);
	var $ = jquery(dom.window);

	$('#main').append(
		$('<img>').attr({
			'class': config.home.avatar.circle ? 'rounded-circle' : 'rounded',
			'src': getAvatar(),
			'alt': 'avatar',
			'width': config.home.avatar.size,
			'height': config.home.avatar.size
		})
	).append(
		$('<div>').addClass('col-md-10 offset-md-1').attr('id', 'info').append(
				$('<h1>').addClass('text-center').text(config.home.name)
			).append(
				$('<h5>').html(config.home.bio)
			).append(
				$('<h5>').html(config.home.info)
			).append(
				$('<h5>').html(config.home.interests)
			)	
	);

	var countNonEmpty = 0;
	for (var key in config.social) {
		if (config.social[key] != "") 
			countNonEmpty++;
	}

	if (countNonEmpty != 0) {
		$('#info').append(
			$('<h5>').text('Connect:')
		).append(
			$('<ul>').attr('id', 'social-list').addClass('list-inline')
		)

		for (var key in config.social) {
			var current = config.social[key];

			if (current != "") {
				switch (key) {
					case 'email':
						addSocialIcon($, 'envelope', 'mailto: ' + current);
						break;
					case 'instagram':
						addSocialIcon($, 'instagram', current);
						break;
					case 'linkedin':
						addSocialIcon($, 'linkedin', current);
						break;
					case 'github':
						addSocialIcon($, 'github', current);
						break;
					case 'twitter':
						addSocialIcon($, 'twitter', current);
						break;
					case 'facebook':
						addSocialIcon($, 'facebook', current);
						break;
					case 'gitea':
						addSocialIcon($, 'code-fork', current);
						break;
					case 'gpg':
						addSocialIcon($, 'key', current);
						break;
					case 'bitcoin':
						addSocialIcon($, 'bitcoin', current);
						break;
					case 'google-plus':
						addSocialIcon($, 'google-plus', current);
						break;
					case 'stackoverflow':
						addSocialIcon($, 'stack-overflow', current);
						break;
					case 'skype':
						addSocialIcon($, 'skype', current);
						break;
					case 'youtube':
						addSocialIcon($, 'youtube', current);
						break;
					default:
						break;
				}
			}
		}		
	}

	fs.writeFileSync('blog/index.html', dom.serialize());
}

generateIndexHTML();

createDir('blog/content');

function generateContentHTML(post) {
	const dom = new JSDOM(base, JSDOM_options);
	var $ = jquery(dom.window);

	// I know this is ugly, but works for now...
	$('#favicon').attr('href', './' + config.site.favicon)

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
