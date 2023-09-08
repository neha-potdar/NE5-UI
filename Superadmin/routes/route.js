var express = require('express');
const request = require('request');
var bodyParser = require('body-parser');
var urlencodeParser = bodyParser.urlencoded({ extended: false });
var validator = require('express-validator');
const Transaction = require('../../models/transactions');
const QueryTypes=require('sequelize')
const Api = require('../../models/api');
const {Sequelize,Op} = require('sequelize')
const sequelize=require('../../database/connection');
const api_names = require('../../models/api');

const axios=require('axios')
const { registerUser, userLogin }=require('../utils/auth')
const flash=require('connect-flash')
const users_api_plans = require('../../models/api_plans')
const User  = require('../../models/user')
const Balance=require('../../models/balance')
const Account = require('../../models/account')
const signup=require('../controllers/AuthController')
const qrcode = require('qrcode')
const { createCanvas, registerFont } = require('canvas')
const { Client } = require('node-rest-client');

const querystring = require('querystring');
//const fetch = require('node-fetch');
const restClient = new Client();






module.exports = function (app) {

      function isUserAllowed(req, res, next) {
            sess = req.session;
            if (sess.user) {
                  return next();
            }
            else { res.redirect('/login'); }
      }

      // async function checkRole(req, res, next) {
      //       const ne5_member_id = req.body.ne5_member_id;
          
      //       try {
      //         // Fetch the user's role from the database
      //         const sqlQuery = `
      //           SELECT role
      //           FROM api_users
      //           WHERE ne5_member_id = :ne5_member_id
      //           LIMIT 1;
      //         `;
          
      //         const [user, _] = await sequelize.query(sqlQuery, {
      //           replacements: { ne5_member_id: ne5_member_id },
      //           type: Sequelize.QueryTypes.SELECT,
      //         });
          
      //         // If the user exists in the database and has a role property
      //         if (user && user.length > 0 && user[0].role) {
      //           // Get the user's role
      //           const role = user[0].role;
          
      //           // Check if the role is "admin"
      //           if (role === "admin") {
      //             // Role is admin, call the next middleware or route handler
      //             next();
      //           } else {
      //             // Role is not admin, return error as Forbidden
      //             res.status(403).json({ error: "Forbidden" });
      //           }
      //         } else {
      //           // User not found in the database or doesn't have a role, return error as Forbidden
      //           res.status(403).json({ error: "Forbidden" });
      //         }
      //       } catch (err) {
      //         // Handle any errors that may occur during the database query
      //         console.error("Error checking user role:", err);
      //         // You can choose to respond with an error or redirect the user to an error page
      //         res.status(500).json({ error: "Internal Server Error" });
      //       }
      //     }

          var sessionChecker = (req,res,next)=>{
		console.log(`Session checker:${req.session.id}`)
            console.log(req.session)
		
		if(req.session.validUser){
			console.log('Found user session', req.session.validUser.name)
			next()
		}else{
			console.log('No user session found')
			res.redirect('/login')
		}
	  }

      // async function retrieveTransactions() {
      //       try {
      //         const transactions = await Transaction.findAll({
      //           attributes: ['id', 'price', 'type', 'credit_debit', 'narration', 'account_type', 'transaction_time'],
      //         });
          
      //         res.render('Dashboard/index', {attributes: attributes})
      //       } catch (error) {
      //         console.error('Error retrieving transactions:', error);
      //       }
      //     }

      // app.get('/',(req,res)=>{
      //       res.locals={title:'Dashboard One'}
      //       res.render('Dashboard/index')
      // })

      app.get('/',sessionChecker,  async (req, res) => {
            res.locals = { title: 'Dashboard One' };
            
            //   res.render('./Dashboard/index', { transactions: transactions.rows, totalCount, totalPages, currentPage: page });
            res.render('./Dashboard/index')
          });
      
          const { Sequelize } = require('sequelize');

          // ...
          
          
          
          app.get('/custom-query', async (req, res) => {
            try {
              const page = parseInt(req.query.page) || 1;
              const limit = 10;
              const offset = (page - 1) * limit;
              const apiName = req.query.apiName;
              const fromDate = req.query.fromDate;
              const toDate = req.query.toDate;
          
              let query = `
                SELECT transactions.transaction_id, transactions.price, transactions.type,
                  transactions.credit_debit, transactions.narration, transactions.account_type, transactions.transaction_time,
                  transactions.api_id, api_names.api_name
                FROM transactions
                JOIN api_names ON transactions.api_id = api_names.id
              `;
          
              let countQuery = `
                SELECT COUNT(*) AS totalRecords
                FROM transactions
                JOIN api_names ON transactions.api_id = api_names.id
              `;
          
              const replacements = {};
              if (apiName || fromDate || toDate) {
                query += `
                  WHERE 1=1
                `;
                countQuery += `
                  WHERE 1=1
                `;
                if (apiName) {
                  query += ` AND api_names.api_name = :apiName`;
                  countQuery += ` AND api_names.api_name = :apiName`;
                  replacements.apiName = apiName;
                }
                if (fromDate) {
                  query += ` AND transactions.transaction_time >= :fromDate`;
                  countQuery += ` AND transactions.transaction_time >= :fromDate`;
                  replacements.fromDate = fromDate;
                }
                if (toDate) {
                  query += ` AND transactions.transaction_time <= :toDate`;
                  countQuery += ` AND transactions.transaction_time <= :toDate`;
                  replacements.toDate = toDate;
                }
              }
          
              query += `
                ORDER BY transactions.transaction_time DESC
                LIMIT :limit
                OFFSET :offset;
              `;
          
              countQuery += ';';
          
              const [transactions, metadata] = await Promise.all([
                sequelize.query(query, {
                  replacements: { ...replacements, limit, offset },
                  type: Sequelize.QueryTypes.SELECT,
                }),
                sequelize.query(countQuery, {
                  replacements,
                  type: Sequelize.QueryTypes.SELECT,
                }),
              ]);
          
              const count = metadata[0].totalRecords;
              const totalPages = Math.ceil(count / limit);
          
              res.render('./Transactions/transactions', {
                transactions,
                totalPages,
                currentPage: page,
                fromDate: fromDate || null,
                toDate: toDate || null,
                apiName: apiName || '',
              });
            } catch (error) {
              console.error('Error fetching transactions:', error);
              res.status(500).json({ error: 'Internal Server Error' });
            }
          });
          
          
          // Search API
         // Add the following route handler for the search API
app.get('/search', async (req, res) => {
      try {
        const searchKeyword = req.body.searchKeyword;
        console.log(searchKeyword)
    
        // Call the custom-query API to fetch the transactions data
        const response = await axios.get('http://localhost:8000/custom-query', {
          params: req.query
        });
    
        // Get the transactions data from the API response
        const transactions = response.data.transactions;
    
        // Filter the transactions based on the search keyword
        const filteredTransactions = transactions.filter((transaction) => {
          // Modify the condition based on your search criteria
          return (
            transaction.transaction_id.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            transaction.narration.toLowerCase().includes(searchKeyword.toLowerCase())
          );
        });
    
        // Render the EJS template with the filtered transactions data
        res.render('search', {
          transactions: filteredTransactions,
          searchKeyword: searchKeyword
        });
      } catch (error) {
        console.error('Error searching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    const addProfileData = (req, res, next) => {
      req.locals = req.locals || {};
      console.log(req.session.validUser.name)
      if (req.session.validUser.name) {
        const userName = req.session.validUser.name;
        const role=req.session.validUser.role;
      //   console.log(userName)
          
        // Calculate the initials from the user's name
        
        const initials = userName
          .split(' ')
          .map(word => word.charAt(0).toUpperCase()) // Ensure initials are in uppercase
          .join('');
    
        // Add the initials to req.locals for access in the route handler
        req.locals.profileName=userName;
        req.locals.Role=role;
        req.locals.userNameInitials = initials;
      } else {
        // If no user session or name found, you can set a default value for the initials
        req.locals.userNameInitials = 'N/A';
        req.locals.profileName = 'undefined';
      }
    
      next();
    };
    
          
     
        
          
        
      app.get('/index-2', isUserAllowed, function (req, res) {
            res.locals = { title: 'Dashboard Two' };
            res.render('Dashboard/index-2');
      });



      // Layouts
      
      app.get('/layouts-compact-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Compact Sidebar', profileImage: dataUrl, profileName:Name, Role };
            res.render('Dashboard/index', { layout: 'layoutsCompactSidebar' });
      });
      app.get('/layouts-icon-sidebar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Icon Sidebar' };
            res.render('Dashboard/index', { layout: 'layoutsIconSidebar' });
      });
      app.get('/layouts-boxed', isUserAllowed, function (req, res) {
            res.locals = { title: 'Boxed Width' };
            res.render('Dashboard/index', { layout: 'layoutsBoxed' });
      });
      app.get('/layouts-preloader', isUserAllowed, function (req, res) {
            res.locals = { title: 'Preloader' };
            res.render('Dashboard/index', { layout: 'layoutsPreloader' });
      });
      
      

      app.get('/layouts-horizontal', isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal' };
            res.render('Dashboard/index', { layout: 'layoutsHorizontal' });
      });
      app.get('/layouts-hori-topbarlight', isUserAllowed, function (req, res) {
            res.locals = { title: 'Topbar Dark' };
            res.render('Dashboard/index', { layout: 'layoutsHTopbarLight' });
      });
      app.get('/layouts-hori-boxed', isUserAllowed, function (req, res) {
            res.locals = { title: 'Boxed Width' };
            res.render('Dashboard/index', { layout: 'layoutsHBoxed' });
      });
      app.get('/layouts-hori-preloader', isUserAllowed, function (req, res) {
            res.locals = { title: 'Preloader' };
            res.render('Dashboard/index', { layout: 'layoutsHPreloader' });
      });
      

      // Color Theme vertical
      app.get("/vertical-dark", isUserAllowed, function (req, res) {
            res.locals = { title: 'Vertical Dark' };
            res.render("Dashboard/index", { layout: "vertical-dark-layout" });
      });
      
      app.get("/vertical-rtl", isUserAllowed, function (req, res) {
            res.locals = { title: 'Vertical Rtl' };
            res.render("Dashboard/index", { layout: "vertical-rtl-layout" });
      });
      
      // Color Theme Horizontal
      app.get("/horizontal-dark", isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal Dark' };
            res.render("Dashboard/index", { layout: "horizontal-dark-layout" });
      });
      
      app.get("/horizontal-rtl", isUserAllowed, function (req, res) {
            res.locals = { title: 'Horizontal Rtl' };
            res.render("Dashboard/index", { layout: "horizontal-rtl-layout" });
      });

      // Calendar
      app.get('/calendar', isUserAllowed, function (req, res) {
            res.locals = { title: 'Calendar' };
            res.render('Calendar/calendar');
      });

      // Email
      app.get('/email-inbox', isUserAllowed, function (req, res) {
            res.locals = { title: 'Inbox' };
            res.render('Email/email-inbox');
      });
      app.get('/email-read', isUserAllowed, function (req, res) {
            res.locals = { title: 'Email Read' };
            res.render('Email/email-read');
      });

      // Tasks
      app.get('/tasks-list', isUserAllowed, function (req, res) {
            res.locals = { title: 'Task List' };
            res.render('Tasks/tasks-list');
      });
      app.get('/tasks-kanban', isUserAllowed, function (req, res) {
            res.locals = { title: 'Kanban Board' };
            res.render('Tasks/tasks-kanban');
      });
      app.get('/tasks-create', isUserAllowed, function (req, res) {
            res.locals = { title: 'Create Task' };
            res.render('Tasks/tasks-create');
      });


      // Pages
      app.get('/pages-starter', isUserAllowed, function (req, res) {
            res.locals = { title: 'Starter Page' };
            res.render('Pages/pages-starter');
      });
      app.get('/pages-invoice', isUserAllowed, function (req, res) {
            res.locals = { title: 'Invoice' };
            res.render('Pages/pages-invoice');
      });
      app.get('/pages-profile', addProfileData, async (req, res) => {
            const { userNameInitials,profileName  } = req.locals;
            const Name = req.session.validUser.name;
            const Role = req.session.validUser.role;
            const canvasWidth = 200;
            const canvasHeight = 200;
          
            // Create a new canvas
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');
          
            // Set the background color
            ctx.fillStyle = '#3498db'; // You can use any color you like
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          
            // Set the text properties for the initials
            ctx.fillStyle = '#ffffff'; // Text color
            ctx.font = 'bold 100px Arial'; // Font and size
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
          
            // Position the initials in the center of the canvas
            const x = canvasWidth / 2;
            const y = canvasHeight / 2;
            ctx.fillText(userNameInitials, x, y);
          
            // Generate the data URL asynchronously
            const dataUrl = await new Promise((resolve, reject) => {
              canvas.toDataURL('image/png', (err, url) => {
                if (err) reject(err);
                else resolve(url);
              });
            });
          
            // Set the content type to 'text/html' and render the EJS template
            res.type('text/html');
            res.render('Pages/pages-profile', { initials: userNameInitials, profileImage: dataUrl, profileName:Name, Role });
          });
          
          
      app.get('/pages-timeline', isUserAllowed, function (req, res) {
            res.locals = { title: 'Timeline' };
            res.render('Pages/pages-timeline');
      });
      app.get('/pages-faqs', isUserAllowed, function (req, res) {
            res.locals = { title: 'FAQs' };
            res.render('Pages/pages-faqs');
      });
      app.get('/pages-pricing', isUserAllowed, function (req, res) {
            res.locals = { title: 'Pricing' };
            res.render('Pages/pages-pricing');
      });

      // UI
      app.get('/ui-alerts', isUserAllowed, function (req, res) {
            res.locals = { title: 'Alerts' };
            res.render('Ui/ui-alerts');
      });
      app.get('/ui-buttons', isUserAllowed, function (req, res) {
            res.locals = { title: 'Buttons' };
            res.render('Ui/ui-buttons');
      });
      app.get('/ui-cards', isUserAllowed, function (req, res) {
            res.locals = { title: 'Cards' };
            res.render('Ui/ui-cards');
      });
      app.get('/ui-carousel', isUserAllowed, function (req, res) {
            res.locals = { title: 'Carousel' };
            res.render('Ui/ui-carousel');
      });
      app.get('/ui-dropdowns', isUserAllowed, function (req, res) {
            res.locals = { title: 'Dropdowns' };
            res.render('Ui/ui-dropdowns');
      });
      app.get('/ui-grid', isUserAllowed, function (req, res) {
            res.locals = { title: 'Grid' };
            res.render('Ui/ui-grid');
      });
      app.get('/ui-images', isUserAllowed, function (req, res) {
            res.locals = { title: 'Images' };
            res.render('Ui/ui-images');
      });
      app.get('/ui-lightbox', isUserAllowed, function (req, res) {
            res.locals = { title: 'Lightbox' };
            res.render('Ui/ui-lightbox');
      });
      app.get('/ui-modals', isUserAllowed, function (req, res) {
            res.locals = { title: 'Modals' };
            res.render('Ui/ui-modals');
      });
      app.get('/add-user',(req,res)=>{
            res.locals={title:'Add User'};
            res.render('./UserInfo/Add-User')
      })

      app.post('/register-user', async (req, res) => {
            try {
                await registerUser(req.body, "user", res);
                // Redirect to a specific route after successful registration
                 // Replace '/success' with the desired route
            } catch (error) {
                console.error('Error registering user:', error);
                res.status(500).send('Internal Server Error');
            }
        });
        
      app.get('/api', async (req, res) => {
            try {
              // Fetch all the API Names from the table
              const users = await users_api_plans.findAll();
          
              // Render the EJS view and pass the API Names data
              res.render('./Dashboard/apiPlans', { users });
            } catch (error) {
              console.error('Error fetching API Names:', error);
              res.status(500).send('Internal Server Error');
            }
          });
      app.post('/register-superadmin',async(req,res)=>{
            await registerUser(req.body,"superadmin",res)


      })
      app.post('/signup', async (req, res) => {
            try {
              const { ne5_member_id,name, password, role } = req.body;
          
              // Check if the user already exists in the database
              const existingUser = await User.findOne({
                where: { ne5_member_id },
              });
          
              if (existingUser) {
                return res.status(409).send('Username already exists. Please choose a different username.');
              }
          
              // Hash the password before storing it in the database
              const hashedPassword = await bcrypt.hash(password, 10);
          
              // Create a new user in the database
              await User.create({
                  ne5_member_id,
                password: hashedPassword,
                role: role || 'user', // Default role is 'user' if not provided
              });
          
              res.redirect('/pages-login');
            } catch (error) {
              
              res.redirect('pages-register')
              console.log('Error creating user')
            }
          });
          
    
      

          app.get('/view-balance', async function (req, res) {
            try {
              const balances = await Balance.sequelize.query(
                'SELECT balance.balance,balance.staging_balance,balance.min_balance,balance.staging_balance,balance.initial_staging_balance, api_users.name FROM balance CROSS JOIN api_users ON balance.api_user_id = api_users.id',
                {
                // Replace with your desired amount value
                  type: Sequelize.QueryTypes.SELECT
                }
              );
          
              res.render('./UserInfo/View-balance', { balances });
            } catch (error) {
              console.error(error);
              res.status(500).json({ message: 'Internal Server Error' });
            }
          });
          
          
          app.get('/view-credentials',async(req,res)=>{
            try{
                  const users=await Balance.sequelize.query('SELECT api_users.id,api_users.ne5_member_id,api_users.name,api_users.password,api_users.role,api_users.client_id,api_users.client_secret,api_users.staging_client_id,api_users.staging_client_secret,balance.balance, balance.staging_balance, balance.min_balance FROM api_users JOIN balance ON api_users.id=balance.api_user_id WHERE balance.balance>0 AND balance.staging_balance>0 AND balance.min_balance>0',
                  
                  {
                        // Replace with your desired amount value
                          type: Sequelize.QueryTypes.SELECT
                        }
                      );
                  
                      res.render('./UserInfo/View-credentials',{users});
                    } catch (error) {
                      console.error(error);
                      res.status(500).json({ message: 'Internal Server Error' });
                    }
          })


          app.get('/user-list',async(req,res)=>{
            try{
                  const users=await Balance.sequelize.query('SELECT api_users.id,api_users.ne5_member_id,api_users.name,api_users.password,api_users.role,api_users.client_id,api_users.client_secret,api_users.staging_client_id,api_users.staging_client_secret,balance.balance, balance.staging_balance, balance.min_balance FROM api_users JOIN balance ON api_users.id=balance.api_user_id WHERE balance.balance>0 AND balance.staging_balance>0 AND balance.min_balance>0',
                  
                  {
                        // Replace with your desired amount value
                          type: Sequelize.QueryTypes.SELECT
                        }
                      );
                  
                      res.render('./UserInfo/Users-List',{users});
                    } catch (error) {
                      console.error(error);
                      res.status(500).json({ message: 'Internal Server Error' });
                    }
          })

          
          app.get('/update-user',(req,res)=>{
            res.render('./UserInfo/Update-User')
          })

          app.post('/generate-access-key', (req, res) => {
            const { userId } = req.body;
        
            // Check if the user exists in the database
            if (!usersDatabase[userId]) {
                return res.status(404).json({ message: 'User not found' });
            }
        
            // Generate an access key for the user
            const accessKey = generateAccessKey();
            
            // Store the access key in the user's record (in a real scenario, you'd likely store it securely in a database)
            usersDatabase[userId].accessKey = accessKey;
        
            // Render the registration success EJS page with the access key
            res.render('registration-success', { accessKey });
        });


          app.get('/view-account', async (req, res) => {
            try {
              const id = req.query.id;
              const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
              const recordsPerPage = 10;
          
              const totalRecords = await Account.count({
                where: { api_user_id: id },
              });
          
              const totalPages = Math.ceil(totalRecords / recordsPerPage);
              const offset = (page - 1) * recordsPerPage;
          
              const accounts = await Account.sequelize.query(
                `SELECT id, bank, accountNumber, ifscCode, transactionLimit, minimumBalance, customer_id, account_type FROM virtual_account_details 
                WHERE api_user_id=${id} 
                LIMIT ${recordsPerPage} OFFSET ${offset}`,
                {
                  type: Sequelize.QueryTypes.SELECT,
                }
              );
          
              res.render('./UserInfo/View-Account', { accounts, totalPages, currentPage: page, id });
            } catch (error) {
              console.error(error);
              res.status(500).json({ message: 'Internal Server Error' });
            }
          });
          // app.get('/update-account', async (req, res) => {
          //   try {
          //     const id = req.query.id;
          //     const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
          //     const recordsPerPage = 10;
          
          //     const totalRecords = await Account.count({
          //       where: { id: id },
          //     });
          
          //     const totalPages = Math.ceil(totalRecords / recordsPerPage);
          //     const offset = (page - 1) * recordsPerPage;
          
          //     const accounts = await Account.sequelize.query(
          //       `SELECT * FROM api_users WHERE api_user.id=${id} 
          //       LIMIT ${recordsPerPage} OFFSET ${offset}`,
          //       {
          //         type: Sequelize.QueryTypes.SELECT,
          //       }
          //     );
          
          //     res.render('./UserInfo/Update-User', { accounts, totalPages, currentPage: page, id });
          //   } catch (error) {
          //     console.error(error);
          //     res.status(500).json({ message: 'Internal Server Error' });
          //   }
          // });
          

          app.get('/vba',(req,res)=>{
            res.render('./UserInfo/VBA')
          })
         
            /*  let response = await axios.post(apiUrl, { name, password }, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });

              console.log("API Response is : ",response);*/

           /*try {
              
          
              const registrationData = response.data.registration_data;
          
              const apiUser = await User.create({
                name,
                password,
                ...registrationData
              });
          
              res.json({ success: true, message: 'Registration Successful', data: apiUser });
            } catch (error) {
              console.error(error);
              res.status(500).json({ success: false, message: 'Registration Failed' });
            } */
          

          

          
          var body = {
            userName: 'Fred',
            userEmail: 'Flintstone@gmail.com'
        }
        
      
          app.get('/info', async (req, res) => {
            try {
              const id = req.query.id;
            
              const accounts = await Account.sequelize.query(
                `SELECT * FROM virtual_account_details 
                WHERE id=${id} 
                LIMIT 1`,
                {
                  type: Sequelize.QueryTypes.SELECT,
                }
                
              );
             
          
              res.render('./UserInfo/Detail-Info', { accounts });
              
            } catch (error) {
              console.error(error);
              res.status(500).json({ message: 'Internal Server Error' });
            }
          });
        
          app.post('/qr', (req, res) => {
            const text = req.body.upiQrCode;
            qrcode.toDataURL(text, (err, src) => {
                res.render('./UserInfo/Show-Qr', { qr_code: src });
            });
        });
        
         

      
      app.post('/login-superadmin',async(req,res)=>{
            await userLogin(req.body, "superadmin", res)

      })
      




      app.get('/ui-rangeslider', isUserAllowed, function (req, res) {
            res.locals = { title: 'Range Slider' };
            res.render('Ui/ui-rangeslider');
      });
      app.get('/ui-session-timeout', isUserAllowed, function (req, res) {
            res.locals = { title: 'Session Timeout' };
            res.render('Ui/ui-session-timeout');
      });
      app.get('/ui-progressbars', isUserAllowed, function (req, res) {
            res.locals = { title: 'Progress Bars' };
            res.render('Ui/ui-progressbars');
      });
      app.get('/ui-sweet-alert', isUserAllowed, function (req, res) {
            res.locals = { title: 'Sweet Alert' };
            res.render('Ui/ui-sweet-alert');
      });
      app.get('/ui-tabs-accordions', isUserAllowed, function (req, res) {
            res.locals = { title: 'Tabs & Accordions' };
            res.render('Ui/ui-tabs-accordions');
      });
      app.get('/ui-typography', isUserAllowed, function (req, res) {
            res.locals = { title: 'Typography' };
            res.render('Ui/ui-typography');
      });
      app.get('/ui-video', isUserAllowed, function (req, res) {
            res.locals = { title: 'Video' };
            res.render('Ui/ui-video');
      });
      app.get('/ui-general', isUserAllowed, function (req, res) {
            res.locals = { title: 'General' };
            res.render('Ui/ui-general');
      });
      
      
      app.get('/ui-colors', isUserAllowed, function (req, res) {
            res.locals = { title: 'Colors' };
            res.render('Ui/ui-colors');
      });
      app.get('/ui-rating', isUserAllowed, function (req, res) {
            res.locals = { title: 'Rating' };
            res.render('Ui/ui-rating');
      });
     

      // Forms
      app.get('/form-elements', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Elements' };
            res.render('Form/form-elements');
      });
      app.get('/form-validation', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Validation' };
            res.render('Form/form-validation');
      });
      app.get('/form-advanced', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Advanced' };
            res.render('Form/form-advanced');
      });
      app.get('/form-editors', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Editors' };
            res.render('Form/form-editors');
      });
      app.get('/form-uploads', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form File Upload' };
            res.render('Form/form-uploads');
      });
      app.get('/form-xeditable', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Xeditable' };
            res.render('Form/form-xeditable');
      });
      app.get('/form-repeater', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Repeater' };
            res.render('Form/form-repeater');
      });
      app.get('/generate-link',  function (req, res) {
            res.locals = { title: 'Generate Payment Link' };
            res.render('./UserInfo/Generate Payment Link');
      });
      app.get('/add-beneficiary',  function (req, res) {
            res.locals = { title: 'Add Beneficiary' };
            res.render('./UserInfo/Add Beneficiary');
      });
      app.get('/form-wizard', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Wizard' };
            res.render('Form/form-wizard');
      });
      app.get('/form-mask', isUserAllowed, function (req, res) {
            res.locals = { title: 'Form Mask' };
            res.render('Form/form-mask');
      });
      app.get('/history', function (req, res) {
            res.locals = { title: 'Credit History' };
            res.render('./UserInfo/History');
      });
      app.get('/manage-beneficiary', function (req, res) {
            res.locals = { title: 'Manage Beneficiary' };
            res.render('./UserInfo/Manage Beneficiery');
      });
      app.get('/photocopy', function (req, res) {
            res.locals = { title: 'Photocopy Check' };
            res.render('./UserInfo/Photocopy');
      });
      app.get('/aadhar', function (req, res) {
            res.locals = { title: 'Aadhar Mask' };
            res.render('./UserInfo/Aadhar Mask');
      });
      app.get('/video-live', function (req, res) {
            res.locals = { title: 'Video Live' };
            res.render('./UserInfo/Video Live');
      });
      app.get('/digi', function (req, res) {
            res.locals = { title: 'Digilocker' };
            res.render('./UserInfo/Digilocker');
      });
      app.get('/data-pull', function (req, res) {
            res.locals = { title: 'Data Pull' };
            res.render('./UserInfo/Data Pull');
      });
      app.get('/credits', function (req, res) {
            res.locals = { title: 'Available Credits' };
            res.render('./UserInfo/Available Credits');
      });
      app.get('/credit-report', function (req, res) {
            res.locals = { title: 'Credit Report' };
            res.render('./UserInfo/Credit Report');
      });
      app.get('/report', function (req, res) {
            res.locals = { title: 'Generate Report' };
            res.render('./UserInfo/Generate Report');
      });
      app.get('/callback', function (req, res) {
            res.locals = { title: 'Callbacks' };
            res.render('./UserInfo/Callbacks');
      });
      app.get('/credit-cards', function (req, res) {
            res.locals = { title: 'Credit Cards' };
            res.render('./UserInfo/Credit Cards');
      });
      app.get('/wallets', function (req, res) {
            res.locals = { title: 'Issued Wallets' };
            res.render('./UserInfo/Issued Wallets');
      });
      app.get('/emandate', function (req, res) {
            res.locals = { title: 'E Mandate' };
            res.render('./UserInfo/eMandate');
      });
      app.get('/validate', function (req, res) {
            res.locals = { title: 'Validate' };
            res.render('./UserInfo/Validate');
      });
      app.get('/collection', function (req, res) {
            res.locals = { title: 'Collection Request' };
            res.render('./UserInfo/Collection Request');
      });
      app.get('/credit', function (req, res) {
            res.locals = { title: 'Credit History' };
            res.render('./UserInfo/Credit');
      });
      app.get('/send-collection', function (req, res) {
            res.locals = { title: 'Collection' };
            res.render('./UserInfo/Collection');
      });
      app.get('/payouts', function (req, res) {
            res.locals = { title: 'Payouts' };
            res.render('./UserInfo/Payout');
      });
      app.get('/analytics', function (req, res) {
            res.locals = { title: 'Analytics' };
            res.render('./Dashboard/index');
      });
      app.get('/payment-link', function (req, res) {
            res.locals = { title: 'Payment Link' };
            res.render('./UserInfo/Payment Links');
      });
    
     
      // Tables
      app.get('/tables-basic', isUserAllowed, function (req, res) {
            res.locals = { title: 'Basic Tables' };
            res.render('Tables/tables-basic');
      });
      app.get('/tables-datatable', isUserAllowed, function (req, res) {
            res.locals = { title: 'Data Tables' };
            res.render('Tables/tables-datatable');
      });
      app.get('/tables-responsive', isUserAllowed, function (req, res) {
            res.locals = { title: 'Responsive Table' };
            res.render('Tables/tables-responsive');
      });
      app.get('/tables-editable', isUserAllowed, function (req, res) {
            res.locals = { title: 'Editable Table' };
            res.render('Tables/tables-editable');
      });
      
      // Charts
      app.get('/charts-apex', isUserAllowed, function (req, res) {
            res.locals = { title: 'Apex charts' };
            res.render('Charts/charts-apex');
      });
      app.get('/charts-chartjs', isUserAllowed, function (req, res) {
            res.locals = { title: 'Chartjs Chart' };
            res.render('Charts/charts-chartjs');
      });
      app.get('/charts-flot', isUserAllowed, function (req, res) {
            res.locals = { title: 'Flot Chart' };
            res.render('Charts/charts-flot');
      });
      app.get('/charts-knob', isUserAllowed, function (req, res) {
            res.locals = { title: 'Jquery Knob Chart' };
            res.render('Charts/charts-knob');
      });
      app.get('/charts-sparkline', isUserAllowed, function (req, res) {
            res.locals = { title: 'Sparkline Chart' };
            res.render('Charts/charts-sparkline');
      });

      // Icons
      app.get('/icons-boxicons', isUserAllowed, function (req, res) {
            res.locals = { title: 'Boxicons' };
            res.render('Icons/icons-boxicons');
      });
      app.get('/icons-materialdesign', isUserAllowed, function (req, res) {
            res.locals = { title: 'Material Design' };
            res.render('Icons/icons-materialdesign');
      });
      app.get('/icons-dripicons', isUserAllowed, function (req, res) {
            res.locals = { title: 'Dripicons' };
            res.render('Icons/icons-dripicons');
      });
      app.get('/icons-fontawesome', isUserAllowed, function (req, res) {
            res.locals = { title: 'Font Awesome' };
            res.render('Icons/icons-fontawesome');
      });

      // Maps
      app.get('/maps-google', isUserAllowed, function (req, res) {
            res.locals = { title: 'Google Maps' };
            res.render('Maps/maps-google');
      });
      app.get('/maps-vector', isUserAllowed, function (req, res) {
            res.locals = { title: 'Vector Maps' };
            res.render('Maps/maps-vector');
      });
      
}