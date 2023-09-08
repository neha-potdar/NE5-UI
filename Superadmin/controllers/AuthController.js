var express = require('express');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });

var validator = require('express-validator');
const sequelize = require('../../database/connection')
const {Sequelize,DataTypes}=require('sequelize')

var axios = require("axios");

const {User}=require('../../models/user')
const bcrypt=require('bcrypt')
const { async } = require('q');
const nodemailer = require('nodemailer');
const querystring = require('querystring');




// This sets the mock adapter on the default instance


let users = [
	{ id: 1, username: 'admin', password: '123456', email: 'admin@themesbrand.com' }
];

// Mock GET request to /users when param `searchText` is 'John'


module.exports = function (app) {
	

	// Inner Auth
	app.get('/pages-login', function (req, res) {
		res.locals = { title: 'Login' };
		res.render('AuthInner/pages-login');
	});
	app.get('/pages-register', function (req, res) {
		res.locals = { title: 'Register' };
		res.render('AuthInner/pages-register');
	});
	app.get('/pages-recoverpw', function (req, res) {
		res.locals = { title: 'Recover Password' };
		res.render('AuthInner/pages-recoverpw');
	});
	app.get('/pages-lock-screen', function (req, res) {
		res.locals = { title: 'Lock Screen' };
		res.render('AuthInner/pages-lock-screen');
	});
	
	app.get('/register', function (req, res) {
		res.locals = { title: 'Lock Screen' };
		res.render('AuthInner/register');
	});


	// Auth Pages

	app.get('/pages-maintenance', function (req, res) {
		res.locals = { title: 'Maintenance' };
		res.render('Pages/pages-maintenance');
	});
	app.get('/pages-comingsoon', function (req, res) {
		res.locals = { title: 'Coming Soon' };
		res.render('Pages/pages-comingsoon');
	});
	app.get('/pages-404', function (req, res) {
		res.locals = { title: 'Error 404' };
		res.render('Pages/pages-404');
	});
	app.get('/pages-500', function (req, res) {
		res.locals = { title: 'Error 500' };
		res.render('Pages/pages-500');
	});


	app.get('/register', function (req, res) {
		if (req.user) { res.redirect('/login'); }
		else {
			res.render('Auth/auth-register', { 'message': req.flash('message'), 'error': req.flash('error') });
		}
	});

	

	app.post('/post-register', urlencodeParser, function (req, res) {
		let tempUser = { username: req.body.username, email: req.body.email, password: req.body.password };
		users.push(tempUser);

		// Assign value in session
		sess = req.session;
		sess.user = tempUser;

		res.redirect('/');
	});


	app.get('/login', function (req, res) {
		res.render('Auth/auth-login', { 'message': req.flash('message'), 'error': req.flash('error') });
	});
	
	
	async function checkSuperadminRole(req, res, next) {
		const ne5_member_id = req.body.ne5_member_id;
		console.log(ne5_member_id)
	  
		try {
		  // Fetch the user's role from the database
		  const sqlQuery = `
			SELECT role,id
			FROM api_users
			WHERE ne5_member_id = :ne5_member_id
			LIMIT 1;
		  `;
			
		  const [user, _] = await sequelize.query(sqlQuery, {
			replacements: { ne5_member_id: ne5_member_id },
			type: Sequelize.QueryTypes.SELECT,
		  });
		  console.log(user)
	  
		  // If the user exists in the database and has a role property
		  console.log("Usern: ",  user.role);
		  if ( user) {
			// Get the user's role
			console.log("Inside if")
			const role = user.role;
			const userId = user.user_id;
			
	  
			// Check if the role is "admin"
			if (role === "Superadmin") {
				// Role is superadmin, allow access to all routes
				req.isAdmin = true; // Set a flag to indicate the user is an admin
				req.isSuperAdmin = true;
				 // Set a flag to indicate the user is a superadmin
				next();
			  } else  {
				// Role is neither admin nor superadmin, return error as Forbidden
				res.status(403).json({ error: "Forbidden - Superadmin role required" });
			  }
			} else {
			  // User not found in the database or doesn't have a role, return error as Forbidden
			  res.status(403).json({ error: "Forbidden - Superadmin role required" });
			}
		  } catch (err) {
			// Handle any errors that may occur during the database query
			console.error("Error checking user role:", err);
			// You can choose to respond with an error or redirect the user to an error page
			res.status(500).json({ error: "Internal Server Error" });
		  }
		}
		function isAdmin(req, res, next) {
			if (req.userRole === 'Admin') {
			  next();
			} else {
			  res.status(403).json({ error: 'Forbidden - Admin role required' });
			}
		  }
	  
	app.post('/post-login', urlencodeParser,checkSuperadminRole,async function (req, res) {
		const ne5_member_id=req.body.ne5_member_id
		const password=req.body.password
		const sqlQuery = `
		SELECT * 
		FROM api_users
		WHERE ne5_member_id = :ne5_member_id
		LIMIT 1;
	  `;

		 const [validUser, _] = await sequelize.query(sqlQuery, {
      replacements: { ne5_member_id: ne5_member_id },
      type: Sequelize.QueryTypes.SELECT,
    });
		if (validUser.password===password) {

			// Assign value in session
			req.session.validUser=validUser
			res.redirect('/')
		} else {
			req.flash('error', 'Incorrect email or password!');
			res.redirect('/login',{'login':validUser,
		'message':'Could not authenticate with given details','active':validUser});
		}
	});

	app.post("/demapi", function(req, res) {
		const baseUrl = "https://api-dev.ne5.money/nee5/UserAPI/user_registration";
		const requestData = {
		  name: req.body.name,
		  password: req.body.password,
		};
		console.log(requestData);
	  
		// Define the headers you want to include in the request
		const headers = {
		  'Content-Type': 'application/x-www-form-urlencoded' // Use the correct content type for form data
		};
	  
		// Serialize the request data as 'x-www-form-urlencoded'
		const serializedData = querystring.stringify(requestData);
	  
		// Perform the Axios request with headers and serialized data
		axios.post(baseUrl, serializedData, {
		  headers: headers,
		})
		.then(function(response) {
		  console.log(response.data); // Log the response data
		  res.render('./UserInfo/Access-Key') // Send the response back to the client if needed
		})
		.catch(function(error) {
		  console.log(error); // Log any errors
		  res.status(500).json({ error: "Something went wrong" }); // Send an error response to the client
		});
	  });
	//   app.post('/create-acc', (req, res) => {
	// 	const formData = req.body; // The data sent in the POST request
	
	// 	const config = {
	// 		method: 'post',
	// 		maxBodyLength: Infinity,
	// 		url: 'https://api-dev.ne5.money/nee5/VirtualAccounts/Create_Virtual_AccountV2',
	// 		headers: {
	// 			'ne5-member-id': 'NE_vHMykm93',
	// 			'client-id': 'efbde94bca9453aaeb3911a8de6315b27a8e16470abe8464526acf001ad923ed',
	// 			'client-secret': '515acb84e84086a3172b86f48ec37316',
	// 			'Content-Type': 'application/json'
	// 		},
	// 		data: JSON.stringify(formData)
	// 	};
	
	// 	axios(config)
	// 		.then(function (response) {
	// 			res.json(response.data); // Send the API response back to the client
	// 		})
	// 		.catch(function (error) {
	// 			console.log(error);
	// 			res.status(500).json({ error: 'An error occurred' }); // Send an error response
	// 		});
	// });
	app.post("/create-acc", function(req, res) {
		const baseUrl = "https://api.ne5.money/nee5/VirtualAccounts/Create_Virtual_AccountV2";
		const requestData = req.body;
		console.log(requestData);
	  
		// Define the headers you want to include in the request
		const headers = {
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'ne5-member-id': 'NE_oK3JCyZ2', 
    	  'client-id': 'c9549a79f1534c0a790f933836c09f2f3eec6a3202985dc5d2047ebf252ea27d', 
    	  'client-secret': '44fac6987bf1236127b4ad8a1b5a1157' // Use the correct content type for form data
		};
	  
		// Serialize the request data as 'x-www-form-urlencoded'
		const serializedData = querystring.stringify(requestData);
	  
		// Perform the Axios request with headers and serialized data
		axios.post(baseUrl, serializedData, {
		  headers: headers,
		})
		.then(function(response) {
		  console.log(response.data);
		  console.log(headers) // Log the response data
		  res.status(200).json(response.data) // Send the response back to the client if needed
		})
		.catch(function(error) {
		  console.log(error); // Log any errors
		  res.status(500).json({ error: "Something went wrong" }); // Send an error response to the client
		});
	  });
	

	app.post('/post-forgot-password', urlencodeParser, function (req, res) {
		var link='localhost:8000/post-forgot-password'
		var transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			service:'gmail',
			port: 465,
			secure: true, // use SSL
			auth: {
				user: 'neharpotdar68@gmail.com',
				pass: 'zooycdyseegxajyh'
			}
		});

			var mainOptions = {
				from: '"Tester" neharpotdar68@gmail.com',
				to: req.body.email,
				subject: 'Your Password Reset Link',
				
				html: `
				<!doctype html>
				<html lang="en-US">
				
				<head>
					<meta content="text/html; charset=utf-8" http-equiv="Content-Type" />
					<title>Reset Password Email Template</title>
					<meta name="description" content="Reset Password Email Template.">
					<style type="text/css">
						a:hover {text-decoration: underline !important;}
					</style>
				</head>
				
				<body marginheight="0" topmargin="0" marginwidth="0" style="margin: 0px; background-color: #f2f3f8;" leftmargin="0">
					<!--100% body table-->
					<table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8"
						style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700); font-family: 'Open Sans', sans-serif;">
						<tr>
							<td>
								<table style="background-color: #f2f3f8; max-width:670px;  margin:0 auto;" width="100%" border="0"
									align="center" cellpadding="0" cellspacing="0">
									<tr>
										<td style="height:80px;">&nbsp;</td>
									</tr>
									
									<tr>
										<td style="height:20px;">&nbsp;</td>
									</tr>
									<tr>
										<td>
											<table width="95%" border="0" align="center" cellpadding="0" cellspacing="0"
												style="max-width:670px;background:#fff; border-radius:3px; text-align:center;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06);">
												<tr>
													<td style="height:40px;">&nbsp;</td>
												</tr>
												<tr>
													<td style="padding:0 35px;">
														<h1 style="color:#1e1e2d; font-weight:500; margin:0;font-size:32px;font-family:'Rubik',sans-serif;">You have
															requested to reset your password</h1>
														<span
															style="display:inline-block; vertical-align:middle; margin:29px 0 26px; border-bottom:1px solid #cecece; width:100px;"></span>
														<p style="color:#455056; font-size:15px;line-height:24px; margin:0;">
															We cannot simply send you your old password. A unique link to reset your
															password has been generated for you. To reset your password, click the
															following link and follow the instructions.
														</p>
														<a href="http://localhost:8000/forgot-password"
															style="background:#20e277;text-decoration:none !important; font-weight:500; margin-top:35px; color:#fff;text-transform:uppercase; font-size:14px;padding:10px 24px;display:inline-block;border-radius:50px;">Reset
															Password</a>
													</td>
												</tr>
												<tr>
													<td style="height:40px;">&nbsp;</td>
												</tr>
											</table>
										</td>
									<tr>
										<td style="height:20px;">&nbsp;</td>
									</tr>
									
									<tr>
										<td style="height:80px;">&nbsp;</td>
									</tr>
								</table>
							</td>
						</tr>
					</table>
					<!--/100% body table-->
				</body>
				
				</html>`
			};
			
transporter.sendMail(mainOptions, function (err, info) {
						if (err) {
							console.log(err);
						} else {
							console.log('Message sent: ' + info.response);
						}
					});
				})

	app.get('/logout', async function(req, res, next) {
		req.session.destroy(function(err) {
			console.log('Destroyed session')
		 })
		res.redirect('/login');
	});

 
};