const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendingVerifyEmail = async function (email: string, secret: string) {
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