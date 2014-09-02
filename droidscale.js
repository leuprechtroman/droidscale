#!/usr/bin/env node

/* 
#################################################################
#				IMPORTANT USER SETTINGS: 						#
#	If you want to add own commands and scaling, do this here 	#
#################################################################
*/

//Associate scales with names.
var size_prefix = "drawable-";
var sizes = {
	"mdpi"		: 1,
	"hdpi"		: 1.5,
	"xhdpi"		: 2,
	"xxhdpi"	: 3,
	"xxxhdpi"	: 4 
};

//Used commands. Do not change unless you know what you're doing!
//A command has to be specified like this:
// PNG output is required!
// "FILETYPE":"inkscape -z -e %INPUT% -w %SIZE -h %SIZE %OUTPUT%"
// %Variables% should be self explanatory
// Attention: the first word has to be the binary! It is tested for existence by using "which"
// Never remove the SVG command!
var commands = {
	"svg": "inkscape -z -D -f %INPUT% -w %SIZE% -h %SIZE% -e %OUTPUT%"
}

/* 
#################################################################
#					END OF USER SETTINGS: 						#
#				Thats where the wilderness starts 				#
#################################################################
*/

//Imports
var async = require('async');
var program = require('commander');
var clc = require('cli-color');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var ProgressBar = require('progress');
var child_process = require('child_process');
var os = require('os');

//Size Object represents the different sizes:
function size(base, multi, desc) {
    this.sidelength = base * multi;
    this.desc = desc;
}

//Function for building the command:

function getCommand(filetype, inputfile, size, outputfile){
	var command = commands[filetype];
	command = command.replace(/%INPUT%/g, inputfile);
	command = command.replace(/%SIZE%/g, size);
	command = command.replace(/%OUTPUT%/g, outputfile);
	return command.split(" ");
}

function changeFileExtension(filename, oldextension, newextension)
{
	return path.basename(filename, oldextension) + "png";
}

//Variables for easy printing:

function error(msg){
	console.log(clc.red.bold("Error: ") + msg);
	process.exit(1);
}

function info(msg){
	console.log(clc.green.bold("Info: ") + msg);
}

function warn(msg){
	console.log(clc.yellow.bold("Warning: ") + msg);
}

//Function for async calling:

function executeJob(job, callback)
{
	//Launch async process
	var async_child = child_process.spawn(job.shift(), job);
	//On completion: either stop with error or continue
	async_child.on('close', function (code) {
  		if(code != 0)
			error(result.output);
		//No error, continue
		bar.tick();
		callback();
	});
}

//Setup commander, but before: look at all available file types:

var supportedFileTypes = "";
for (var name in commands) {
  supportedFileTypes += name + ", ";
}
supportedFileTypes = supportedFileTypes.substr(0, supportedFileTypes.length - 2); //Chop off last comma and space

program
  .version('0.9.3')
  .option('-f, --filetype [type]', 'Input file type; supported: ' + supportedFileTypes + '; defaults to: svg', 'svg')
  .option('-i, --input [folder]', 'Folder with all images')
  .option('-o, --output [folder]', 'Specify the output folder. If it does not exist, it will be created')
  .option('-b, --basesize <pixels>', 'Base size for mdpi devices in pixels, default 48 results in 48px x 48px icons', 48)
  .parse(process.argv);

//We don't need supportedFileTypes anymore:
delete supportedFileTypes;

//Arguments submitted? If not, show help
if(!program.args.length)
	program.help();

//First, check necessary input arguments:
if(!program.input)
	error("Please specify input folder");
if(!program.output)
	error("Please specify output folder");

//Check if tool exists: Extract first word of command and test with which!
var toolBinary = commands[program.filetype].substr(0, commands[program.filetype].indexOf(' '));
if (!shell.which(toolBinary))
	error("This script requires " + toolBinary + " to process " + program.filetype + " files");
var toolArgs = commands[program.filetype].substr(toolBinary.length, commands[program.filetype].length);

//resolve paths:
var inputPath = path.resolve(program.input);
var outputPath = path.resolve(program.output);

// Now test input path:
if(!fs.existsSync(inputPath))
	error("Please specify an existing input directory");

/*
	Everything okay, start the script:
*/

info("DroidScale v"+program.version()+ " starting...");

//Create output path if necessary
if(!fs.existsSync(outputPath))
{
	try {
		shell.mkdir('-p', outputPath);
		info("Output directory " + outputPath + " is missing, creating it...");
	}
	catch(err)
	{
		error(err.message);
	}
}

//Check if directories exist, otherwise create them
for(var size in sizes) {
	var target_dir = path.join(outputPath, size_prefix + size);
	if(!fs.existsSync(target_dir))
	{
		try {
			shell.mkdir(target_dir);
			info("Output directory for " + size + " is missing, creating it...");
		}
		catch(err)
		{
			error(err.message);
		}
	}
}

//Collect all files:
var files = fs.readdirSync(inputPath);

//Filter for our file extension:
files = files.filter(function (element) {
	var extension = "." + program.filetype;
	return path.extname(element) == extension;
});

info("Found " + files.length + " files of type " + program.filetype);

var jobs = Array();
//For every size, do:
for(var size in sizes) {
	//Setup variables
	var target_dir = path.join(outputPath, size_prefix + size);
	var pixel_size = sizes[size] * program.basesize;
  	
  	for(var i = 0; i < files.length; i++)
	{
		var new_filename = changeFileExtension(files[i], program.filetype);
		jobs.push(getCommand(program.filetype, path.join(inputPath, files[i]), pixel_size, path.join(target_dir, new_filename)));
	}
}

var job_count = os.cpus().length;

info("Scheduled " + jobs.length + " resizes, always " + job_count + " in parallel");

var start_time = new Date();

//Create progressbar
	var bar = new ProgressBar('Generating icons: :eta seconds remaining [:bar] :percent', {
    	complete: '#',
    	incomplete: '-',
    	width: 1024,
    	total: jobs.length
  	});

async.eachLimit(jobs, job_count, executeJob, function (err) {
	var end_time = new Date();
	var elapsed_sec =  (end_time.getTime() - start_time.getTime()) / 1000;
	info("Finished " + jobs.length + " conversions in " + Math.round(elapsed_sec) + " seconds");
});

