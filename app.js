var express=require('express');
var session=require('express-session');
var bodyParser=require('body-parser');
var db=require('./db.js');
var multer=require('multer');  
var app= express();  
var varify_email = require('./mailfunction.js');

//configuration for multer
var storage=multer.diskStorage({
    destination:(req,file,cb)=>{     
        cb(null,'public/uploads/');
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"--"+file.originalname)
    }
});
const storage_config=multer({storage:storage});
//end of configuration for multer
// Configuration for profile picture storage
var profilePicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/profile_images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname);
    }
});

// Multer instance for profile picture storage
const profilePicUpload = multer({ storage: profilePicStorage });

// Configuration for banner image storage
var bannerImgStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/banner_images/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname);
    }
});

// Multer instance for banner image storage
const bannerImgUpload = multer({ storage: bannerImgStorage });

app.use(session({secret:"TEst123!@#ADF24"}));
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');
app.use(express.static(__dirname+"/public"));  

app.get('/',function(req,res){
    
    var msg="";

    if(req.session.msg!="") {
    msg=req.session.msg;
    res.render('login',{msg:msg});
    }

});

app.post('/login_submit',function(req,res){
    const{email,pass}=req.body;    
    let sql="";                    

    if(isNaN(email)){

        sql="select * from users where email='"+email+"' and password='"+pass+"'";
    }

    else{

        sql="select * from users where mobile="+email+" and password='"+pass+"'";

    }

    db.query(sql,function (err, result,fields){
        if(err)
        throw err;

        if(result.length==0){
        res.render('login',{msg:"Bad credentials"});
        }

        else{
            req.session.uid=result[0].uid;
            req.session.un = result[0].username;
            req.session.profilepic =result[0].profilepic;
            req.session.header_img = result[0].header_img;
            res.redirect('/home');
        }
    });
});

//users signup
app.get('/signup',function(req,res){
    res.render('signup',{msg:""});
});

app.post('/reg_submit',function(req,res){
    const{fname,mname,lname,email,cpass,dob,gender,username}=req.body;

    let sql_check="";
    if(isNaN(email)){
    sql_check="select email from users where email='"+email+"'";
    }
    else{
        sql_check="select mobile from users where email="+email;
    }
        db.query(sql_check,function(err,result,fields){
            if(err)
               throw err;

            if(result.length==1){
                var errmsg="";
                if(isNaN(email))
                    errmsg="Email id already in use";
                else
                    errmsg="Mobile number already in use";

                res.render('signup',{msg:errmsg});
            }

        else{
            
            var sql="";

            if(isNaN(email)){
                sql="insert into users (fname,mname,lname,email,password,dob,dor,gender,username) values (?,?,?,?,?,?,?,?,?)";
            }

            else{
                sql="insert into users (fname,mname,lname,mobile,password,dob,dor,gender,username) values (?,?,?,?,?,?,?,?,?)";
            }

            let d=new Date();
            let m=d.getMonth()+1;  
            let dor=d.getFullYear()+"-"+m+"-"+d.getDate();

            db.query(sql,[fname,mname,lname,email,cpass,dob,dor,gender,username],function(err,result,fields){

            if(err)
                throw err;

            if(result.insertId>0)
            {
              if(isNaN(email)){
                varify_email(email);
              }
                req.session.msg="Account created check email for verification link";
                res.redirect('/'); 
            }
            else{
                res.render("signup",{msg:"can not register you try again"});
            }
            });
        }
        });
    
});

app.get('/home',function(req,res){
    if(req.session.uid!="")
    {
        let msg="";
        if(req.session.msg!="")
            msg=req.session.msg;

        let sql="select * from tweet inner join users on users.uid=tweet.uid where tweet.uid=? or tweet.uid in (select follow_uid from followers where uid=?) or content like '%"+req.session.un+"%' order by tweet.datetime desc;"
       

        db.query(sql,[req.session.uid,req.session.uid],function(err,result,fields){
            res.render("home",{result:result,msg:msg,req:req});
        });
        
    }
    else{
        req.session.msg="Please login first to view home page";
        res.redirect('/');
    }

});

app.get('/logout',function(req,res){
    req.session.uid="";  
    res.redirect('/');
});
app.post('/tweet_submit',storage_config.single('tweet_img'), function(req,res){

       const tweet=req.body.tweet;
       console.log("tweet user done "+tweet);

       var filename="";
       var mimetype="";

       try{
        filename=req.file.filename;
        mimetype=req.file.mimetype;
       }
       catch(err){
        console.log(err);
       }
       

    let sql="insert into tweet (uid,content,datetime,img_vdo_name,type) values (?,?,?,?,?)";

    let d=new Date();
    let m=d.getMonth()+1;
    let dt=d.getFullYear()+"-"+m+"-"+d.getDate()+" "+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds();

    db.query(sql,[req.session.uid,tweet,dt,filename,mimetype],function(err,result){

        if(result.insertId>0){
            res.redirect('/home');
        }
        else{
            res.redirect('/home');
        }
    });
});

app.get('/uprofile', function(req,res){
    db.query("select fname,mname,lname,about,profilepic,header_img,username from users where uid=?",[req.session.uid],function(err,result,fields){
        if(result.length==1){
            res.render('editprofile',{result:result});
        }
        else
        res.redirect('/');
    });
});

app.post('/pic_submit',profilePicUpload.single('pic_img'), function(req,res){
    var filename= "";
    try {
        filename = req.file.filename;
    } catch (error) {
        console.log(error);
    }
    let sql="UPDATE users set profilepic = ? where uid = ?;";
    db.query(sql,[filename,req.session.uid],function(err,result,fields){
        if(result.affectedRows==1){
            req.session.msg="Profile Pic  updated";
            req.session.profilepic = filename;
            res.redirect('/home');
        }
        else{
            req.session.msg="Profile Pic not updated";
            res.redirect('/home');
        }
    })
});

app.post('/banner_submit',bannerImgUpload.single('banner_img'), function(req,res){
    
    var filename= "";
    try {
        filename = req.file.filename;
    } catch (error) {
       console.log(error);
    }
    let sql="UPDATE users set header_img = ? where uid = ?;";
    db.query(sql,[filename,req.session.uid],function(err,result,fields){
        if(result.affectedRows==1){
            req.session.msg="Banner Image  updated";
            req.session.header_img = filename;
            res.redirect('/home');
        }
        else{
            req.session.msg="Banner Image not updated";
            res.redirect('/home');
        }
    });
});

// Route for updating profile details
app.post('/profile_submit', function(req, res) {
    const { fname, mname, lname, about_user, username } = req.body;
    let sql = "UPDATE users SET fname=?, mname=?, lname=?, about=?, username=? WHERE uid=?";

    db.query(sql, [fname, mname, lname, about_user, username, req.session.uid], function(err, result) {
        if (err)
            throw err;

        if (result.affectedRows == 1) {
            req.session.msg = "Profile detail updated";
            res.redirect("/home");
        } else {
            req.session.msg = "Cannot update Profile detail";
            res.redirect("/home");
        }
    });
});

// Route for changing password
app.post('/password_submit', function(req, res) {
    const { current_password, new_password, confirm_password } = req.body;
    const uid = req.session.uid;

    // Check if new password and confirm password match
    if (new_password !== confirm_password) {
        req.session.msg = "New password and confirm password do not match";
        res.redirect("/home");
    }

    // Query to check if current password is correct 
    let sql = "SELECT password FROM users WHERE uid = ?";
    db.query(sql, [uid], function(err, results) {
        if (err)
            throw err;

        if (results.length === 1) {
            const storedPassword = results[0].password;
            // Compare the stored password with the entered current password
            if (storedPassword !== current_password) {
                req.session.msg = "Incorrect current password";
                return res.redirect("/home");
            }

            // Update the password in the database
            sql = "UPDATE users SET password = ? WHERE uid = ?";
            db.query(sql, [new_password, uid], function(err, result) {
                if (err)
                    throw err;

                if (result.affectedRows == 1) {
                    req.session.msg = "Password updated successfully";
                    res.redirect("/home");
                } else {
                    req.session.msg = "Unable to update password";
                    res.redirect("/home");
                }
            });
        } else {
            req.session.msg = "User not found";
            res.redirect("/home");
        }
    });
});

app.get('/following',function(req,res){

    let sql = "select * from users where uid in (select fid from followers where uid =?)"

    db.query(sql,[req.session.uid],function(err,result){

        if(err)
            throw err;
        res.render("following_list",{result:result,msg:"",req:req});
    });
});

//search_data
app.get('/search_data',function(req,res){

    const search_string=req.query['search'];
    let sql = "select * from users where username like '%"+search_string+"%'";

    db.query(sql,[search_string],function(err,result,fields){

        res.render('search_result',{result:result,msg:"",req:req});
    });
});
app.get('/varify',function(req,res){
    let email = req.query['email'];
    let sql_update="update users set status =1 where email=?";
    db.query(sql_update,[email],function(err,result){
        if(err)
            throw err;
        if(result.affectedRows==1){
            req.session.msg = "Email id verified now you can login";
            res.redirect('/');
        }
        else{
            req.session.msg = "Can't verify Email id, Kindly contact Admin of the Website ";
            res.redirect('/');
        }
    })
})

app.listen(8080, function(){
    console.log("server running at localhost port no 8080");
});

