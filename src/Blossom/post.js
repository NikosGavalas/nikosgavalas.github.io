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
		var test = 'asdf dfasfqw $$ peos $$ fja jf;';
		test = test.split('$$');
		var ret = '';
		for (var i = 0; i < test.length; i++) {
			if (i % 2 == 0) {
				ret += test[i];
			} 
		}
		console.log(ret);

		var part = this.content.split('$$');
		var ret = '';

		for (var i = 0; i < part.length; i++) {
			if (i % 2 == 0) {
				ret += part[i];
			}
		}

		return converter.makeHtml(this.content.split(/$$.+$$/g).join(''));
	}
}

module.exports = Post; 

