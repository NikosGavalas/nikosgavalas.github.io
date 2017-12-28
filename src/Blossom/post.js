'use strict';

var showdown = require('showdown'),
	converter = new showdown.Converter({ tables: true });

class Post
{
	constructor(title, date, filename, content)
	{
		this.title = title;
		this.date = date;
		this.filename = filename;
		this.content = content;
	}

	getTitle()
	{
		return this.title;
	}

	getDate()
	{
		return this.date;
	}

	getFileName()
	{
		return this.filename.replace(/.md/, '.html');
	}

	getContent()
	{
		return converter.makeHtml(this.content);;
	}
}

module.exports = Post; 

