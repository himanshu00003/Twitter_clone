var nodemailer = require('nodemailer');
//www.abc.com smtp name smtp.abc.com
async function sendVarifyMail(email_to){
    var transporter = nodemailer.createTransport({
        service:"gmail",
        host:'smtp.mail.com',
        port:465,//gmail ka port number
        secure:false,
        auth:{
            user:"himanshumehta.283@gmail.com",
            pass:"oxagcktcmajravlc",
        }
    });
    var mailmsg="<h1 style=\"color:red\">Please click on the link to verify your email</h1><br/><a href=\"http://localhost:8080/varify?email="+email_to+"\">Click here</a>"
    try{
        var info=await transporter.sendMail({
            to:email_to,
            from:'himanshumehta.283@gmail.com',
            subject:'varify email for twitter clone',
            html: mailmsg
        });
    }    
    catch (err) {
        console.log(err);
    }
    if(info.messageId){
        return true;
    }
    else{
        return false;
    }
}
module.exports =sendVarifyMail;