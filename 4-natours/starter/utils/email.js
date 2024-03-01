const nodemailer=require('nodemailer');

//options for ex: subject , email contents , email , headline etc..
const sendEmail=async(options)=>{
    //1) create a transporter 
    var transporter=nodemailer.createTransport({
        //service:'Gmail',
        host:process.env.EMAIL_HOST,
        port:process.env.EMAIL_PORT,
        auth:{
            user:process.env.EMAIL_USERNAME,
            pass:process.env.EMAIL_PASSWORD
        },
        authMethod: 'LOGIN',
        //activate in gmail "less secure app" option 
    })
    //VERIFY THAT CONNECTION IS READY (OPTIONAL STEP)
    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log('Server is ready to take our messages');
        }
    });

    //2) define email options
    const mailOptions={
        from: 'admin@jonas.io',
        to:options.email,
        subject:options.subject,
        text:options.message,
    };

    //3) send email with nodemailer
    await transporter.sendMail(mailOptions);
}

module.exports= sendEmail;
