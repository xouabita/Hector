var fs     = require('fs');
var JSZip  = require('node-zip');
var jade   = require('jade');
var stylus = require('stylus');
var path   = require('path');

function rm_rf (dir) {
	var list = fs.readdirSync(dir);
	list.forEach( function (elem) {
		var filename = path.join(dir, elem);
		var stat     = fs.statSync(filename);
		if (filename == "." || filename == ".." ) {}
		else if (stat.isDirectory()) {
			rm_rf(filename);
		} else {
			fs.unlinkSync(filename);
		}
	});
	fs.rmdirSync(dir);
}

function makeZip(dir, zip) {
	var files = fs.readdirSync(dir);
	files.forEach(function (file) {
		var real = path.join(dir,file);
		if (fs.lstatSync(real).isFile()) {
			// Switch extension
			switch (file.split('.').pop()) {
				case "jade":
					// Jade Render
					jade.renderFile(real, {}, function (err, html) {
						if (err) { console.log(err); throw err; }
						var out  = file.substr(0, file.lastIndexOf('.')) + ".html";
						zip.file(out, html);
					});
					break;
				case "stylus":
					// Stylus Render
					var styl = fs.readFileSync(real, 'utf-8');
					var out  = file.substr(0, file.lastIndexOf('.')) + ".css";
					stylus.render(styl, {filename : 'nesting.css'}, function(err, css) {
						if (err) throw err;
						zip.file(out, css);
					});
					break;
				default:
					// Just add the file to the zip
					var data = fs.readFileSync(real, 'utf-8');
					zip.file(file, data);
					break;
			}
		} else {
			makeZip(real, zip.folder(file));
		}
	});
}

/*************************************
 ************** Tasks ****************
 *************************************/

desc('Build the src folder into .nw');
task('build', function (params) {
	var zip  = new JSZip();
	makeZip('./src/', zip);
	var data = zip.generate({base64:false,compression:'DEFLATE'});
	if (!fs.existsSync('./build')) {
		fs.mkdirSync('./build');
	}
	fs.writeFileSync('./build/app.nw', data, 'binary');
});

desc('Run the application');
task('run', ['build'], function (params) {
	jake.exec(['nodewebkit build/app.nw'], {}, function () {
		complete();
	});
});

desc('Delete build files');
task('clean', function (params) {
	if (fs.existsSync('./build'))
		rm_rf('./build');
}) 