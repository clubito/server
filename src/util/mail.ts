import nodemailer from "nodemailer";

export const sendingVerifyEmail = async function (email: string, secret: string) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    const testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.ZOHOMAIL, // generated ethereal user
            pass: process.env.ZOHOPASS, // generated ethereal password
        },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: "\"Clubito\" <dvtung98@zohomail.com>", // sender address
        to: email, // list of receivers
        subject: "New account confirmation", // Subject line
        html: `Hello customer. Please click <a href="http://${process.env.HOSTNAME}/verify/${secret}">HERE</a> to verify your account. Thank you`, // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
};