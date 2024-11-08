import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL if required
    auth: {
        user: 'admin@tactix.asia',
        pass: 'ooau rpxc vddt jrfq'
    },
    tls: { rejectUnauthorized: false }
});


export default transporter;