//required node modules
var fs = require('fs');

var uuid = require('node-uuid');
 
var Nightmare = require('nightmare'),
    vo = require('vo');
const screenshotSelector = require('nightmare-screenshot-selector');
var nightmare = Nightmare({show:true});

var request = require('request');

var Antigate = require('antigate');

var ag = new Antigate('e90f34561b773d523c7d1a51ed6d08b2');



Nightmare.action('screenshotSelector', screenshotSelector)

//initial params
var initial_url = 'https://www.facebook.com/search/people/?q=fezesi@tin.it'
var file_name = uuid.v4();
var obj = {
	'url': initial_url,
	'User_Agent': '',
	'proxy': 'ec2-54-202-65-58.us-west-2.compute.amazonaws.com:3128'
}
main(obj);
//main function
function main(obj){

	var nightmare = Nightmare({show: true,
		switches : {
			'proxy-server': obj.proxy
		}
	})

	var scrape = function * (obj) {

	    yield nightmare.goto(obj.url)
	    	// .useragent(obj.User_Agent)
	        .inject("js", "jquery.min.js")

	        .evaluate(function(){
	        	return $('#captcha h3').text();
	        })
	        .then(function(is_captcha){
	        	if (is_captcha == 'Security Check'){
	        		vo(get_captcha)();
	        	} else {
	        		vo(no_captcha)();
	        	}
			})
	}
	var handle_captcha = function * (text) {
	    var handle_captcha_code = text;
	    yield nightmare 
	        .insert('#captcha_response', handle_captcha_code)
	        .click('#u_0_f')
	        .evaluate(function(){
	            //here is where I want to return the html body
	            return $('html').html();
	        })
	        .then(function(body){
	        	print(body);
	        })
	}

	var get_captcha = function * () {
		yield nightmare 
			.wait('#captcha img')
	        .screenshotSelector({selector: '#captcha img', path:file_name + '.png'}) 
			.then(function(){
				// Recognize the captcha from file 
				ag.processFromFile(file_name + '.png', function(error, text, id) {
				  	if (error) {
				    	throw error;
				  	} else {
				  		fs.unlink(file_name + '.png', (err) => {
						  	if (err) throw err;
						  	console.log('successfully deleted captcha image');
				    		vo(handle_captcha)(text);
						});
				  	}
				});
				// Report bad captcha 
				ag.report('CAPTCHA_ID_HERE');
				 
				// Get you blanace 
				ag.getBalance(function(error, balance) {
				  	if (error) {
				    	throw error;
				  	} else {
				    	console.log(balance);
				  	}
				});
			})
	}

	var no_captcha = function * () {
		yield nightmare 
	        .evaluate(function(){
	            //here is where I want to return the html body
	            return $('html').html();
	        })
	        .then(function(body){
	        	print(body);
	        })
	}

	function print(body) {
		fs.writeFile('index.html', body, function(err){
			if(err){
				console.log(err);
			} else {
			  	console.log('File successfully written! - Check your project directory for the index.html file');
				process.exit();
			}
		}) // write it back 
		
	}

	//call main function
	vo(scrape)(obj);
}