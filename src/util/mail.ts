import { SENDGRID_API_KEY } from "../util/secrets";
import sgMail from "@sendgrid/mail";
import logger from "@logger";
import { HOSTNAME } from "../util/secrets";
sgMail.setApiKey(SENDGRID_API_KEY);
const optionsArray = ["verify", "forgot", "newpass"];

export const sendingEmail = async function (email: string, secret: string, option: string) {
    if (!optionsArray.includes(option)) {
        logger.error("option field is not suitable");
        return;
    }

    let subject;
    let html;
    if (option == "verify") {
        subject = "Account verification from Clubito";
        html = `Hello customer. Please click <a href="${HOSTNAME}/${option}/${secret}">HERE</a> to verify your account. Thank you`;
    } else if (option == "forgot") {
        subject = "Forgot your password?";
        const url = `${HOSTNAME}/${option}/${secret}`;
        html = `Click this link to verify that you forgot your password.</br><a href="${url}">${url}</a>`;
    } else if (option == "newpass") {
        subject = "Your new password information";
        html = `This is your new password. Please log in and change your password to better secure your account</br>Password: ${secret}`;
    }

    const msg = {
        to: email, // Change to your recipient
        from: "admin@clubito.me", // Change to your verified sender
        subject,
        html,
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log("Email sent");
        })
        .catch((error) => {
            console.error(error);
        });
};