const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// import nodemailer from "nodemailer";

export const sendingVerifyEmail = async function (email: String, secret: String) {
    /** 
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.ZOHOMAIL, // generated ethereal user
            pass: process.env.ZOHOPASS, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Clubito" <dvtung98@zohomail.com>', // sender address
        to: email, // list of receivers
        subject: "New account confirmation", // Subject line
        html: `Hello customer. Please click <a href="http://${process.env.HOSTNAME}/verify/${secret}">HERE</a> to verify your account. Thank you`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    */

    // using Twilio SendGrid's v3 Node.js Library
    // https://github.com/sendgrid/sendgrid-nodejs

    const msg = {
        to: email, // Change to your recipient
        from: 'admin@clubito.me', // Change to your verified sender
        subject: 'Sending with SendGrid is Fun',
        html: `Hello customer. Please click <a href="${process.env.HOSTNAME}/verify/${secret}">HERE</a> to verify your account. Thank you`,
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })

}